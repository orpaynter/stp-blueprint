const mongoose = require('mongoose');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Project = require('./projectModel');
const User = require('../../auth/models/User');
const { uploadToS3, deleteFromS3 } = require('../../utils/s3Utils');
const openWeatherMapService = require('../../../integrations/openweathermap/src/openweathermap-service');
const schedulerService = require('../../../agents/scheduler/scheduler');

/**
 * Get all projects (filtered by user role and permissions)
 * @route GET /api/projects
 * @access Private
 */
exports.getAllProjects = catchAsync(async (req, res, next) => {
  let filter = {};
  
  // Filter projects based on user role
  if (req.user.role === 'homeowner') {
    // Homeowners can only see their own projects
    filter.homeownerId = req.user.id;
  } else if (req.user.role === 'contractor') {
    // Contractors can see projects they're assigned to
    filter.contractorId = req.user.id;
  } else if (req.user.role === 'supplier') {
    // Suppliers can see projects they're supplying materials for
    filter.supplierId = req.user.id;
  } else if (req.user.role === 'insurance_agent') {
    // Insurance agents can see projects with claims they're handling
    filter.insuranceAgentId = req.user.id;
  }
  // Admins can see all projects (no filter)
  
  // Apply additional filters from query params
  const queryParams = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete queryParams[field]);
  
  // Advanced filtering
  let queryStr = JSON.stringify(queryParams);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|eq|ne)\b/g, match => `$${match}`);
  
  // Combine filters
  filter = { ...filter, ...JSON.parse(queryStr) };
  
  // Build query
  let query = Project.find(filter);
  
  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  query = query.skip(skip).limit(limit);
  
  // Execute query
  const projects = await query;
  
  // Get total count for pagination
  const totalCount = await Project.countDocuments(filter);
  
  res.status(200).json({
    status: 'success',
    results: projects.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    data: {
      projects
    }
  });
});

/**
 * Get project by ID
 * @route GET /api/projects/:id
 * @access Private
 */
exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('homeownerId', 'firstName lastName email phone')
    .populate('contractorId', 'firstName lastName email phone company')
    .populate('team.userId', 'firstName lastName email phone role')
    .populate('materials.supplierId', 'firstName lastName email phone company');
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  // Check if user has access to this project
  if (
    req.user.role !== 'admin' &&
    project.homeownerId._id.toString() !== req.user.id &&
    project.contractorId._id.toString() !== req.user.id &&
    !project.team.some(member => member.userId._id.toString() === req.user.id) &&
    !project.materials.some(material => material.supplierId && material.supplierId._id.toString() === req.user.id)
  ) {
    return next(new AppError('You do not have permission to access this project', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

/**
 * Create new project
 * @route POST /api/projects
 * @access Private (Contractors, Admins)
 */
exports.createProject = catchAsync(async (req, res, next) => {
  // Extract project data from request body
  const {
    title,
    description,
    homeownerId,
    address,
    projectType,
    estimatedStartDate,
    estimatedEndDate,
    budget,
    materials,
    scope
  } = req.body;
  
  // Validate homeowner exists
  const homeowner = await User.findById(homeownerId);
  if (!homeowner || homeowner.role !== 'homeowner') {
    return next(new AppError('Invalid homeowner ID', 400));
  }
  
  // Create new project
  const newProject = await Project.create({
    title,
    description,
    homeownerId,
    contractorId: req.user.id, // Current user (contractor) is assigned to project
    address,
    projectType,
    estimatedStartDate,
    estimatedEndDate,
    budget,
    materials: materials || [],
    scope,
    status: 'pending',
    timeline: [{
      event: 'Project Created',
      description: 'Project has been created and is pending homeowner approval',
      date: Date.now(),
      userId: req.user.id
    }],
    team: [{
      userId: req.user.id,
      role: 'project_manager',
      permissions: ['manage:project', 'update:project', 'delete:project']
    }]
  });
  
  // Use scheduler agent to optimize project schedule if dates are provided
  if (estimatedStartDate && estimatedEndDate) {
    try {
      const optimizedSchedule = await schedulerService.optimizeProjectSchedule({
        projectId: newProject._id,
        location: address,
        startDate: new Date(estimatedStartDate),
        endDate: new Date(estimatedEndDate),
        projectType,
        scope
      });
      
      // Update project with optimized schedule
      newProject.schedule = optimizedSchedule;
      await newProject.save();
    } catch (err) {
      // Continue even if scheduling optimization fails
      console.error('Error optimizing project schedule:', err);
    }
  }
  
  res.status(201).json({
    status: 'success',
    data: {
      project: newProject
    }
  });
});

/**
 * Update project
 * @route PATCH /api/projects/:id
 * @access Private (Contractors, Admins)
 */
exports.updateProject = catchAsync(async (req, res, next) => {
  // Find project
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  // Check if user has permission to update this project
  if (
    req.user.role !== 'admin' &&
    project.contractorId.toString() !== req.user.id &&
    !project.team.some(member => 
      member.userId.toString() === req.user.id && 
      member.permissions.includes('update:project')
    )
  ) {
    return next(new AppError('You do not have permission to update this project', 403));
  }
  
  // Extract fields to update
  const {
    title,
    description,
    status,
    projectType,
    estimatedStartDate,
    estimatedEndDate,
    budget,
    scope
  } = req.body;
  
  // Update project
  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      status,
      projectType,
      estimatedStartDate,
      estimatedEndDate,
      budget,
      scope
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  // Add timeline event for status change
  if (status && status !== project.status) {
    updatedProject.timeline.push({
      event: 'Status Updated',
      description: `Project status changed from ${project.status} to ${status}`,
      date: Date.now(),
      userId: req.user.id
    });
    
    await updatedProject.save();
  }
  
  // Re-optimize schedule if dates changed
  if (
    (estimatedStartDate && estimatedStartDate !== project.estimatedStartDate) ||
    (estimatedEndDate && estimatedEndDate !== project.estimatedEndDate)
  ) {
    try {
      const optimizedSchedule = await schedulerService.optimizeProjectSchedule({
        projectId: updatedProject._id,
        location: updatedProject.address,
        startDate: new Date(estimatedStartDate || updatedProject.estimatedStartDate),
        endDate: new Date(estimatedEndDate || updatedProject.estimatedEndDate),
        projectType: updatedProject.projectType,
        scope: updatedProject.scope
      });
      
      // Update project with optimized schedule
      updatedProject.schedule = optimizedSchedule;
      await updatedProject.save();
    } catch (err) {
      // Continue even if scheduling optimization fails
      console.error('Error optimizing project schedule:', err);
    }
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project: updatedProject
    }
  });
});

/**
 * Delete project
 * @route DELETE /api/projects/:id
 * @access Private (Contractors, Admins)
 */
exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  // Check if user has permission to delete this project
  if (
    req.user.role !== 'admin' &&
    project.contractorId.toString() !== req.user.id &&
    !project.team.some(member => 
      member.userId.toString() === req.user.id && 
      member.permissions.includes('delete:project')
    )
  ) {
    return next(new AppError('You do not have permission to delete this project', 403));
  }
  
  // Instead of hard delete, mark as inactive
  project.active = false;
  project.status = 'cancelled';
  project.timeline.push({
    event: 'Project Cancelled',
    description: 'Project has been cancelled',
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Project successfully cancelled'
  });
});

/**
 * Get project timeline
 * @route GET /api/projects/:id/timeline
 * @access Private
 */
exports.getProjectTimeline = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .select('timeline')
    .populate('timeline.userId', 'firstName lastName');
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      timeline: project.timeline
    }
  });
});

/**
 * Add timeline event
 * @route POST /api/projects/:id/timeline
 * @access Private (Contractors, Admins)
 */
exports.addTimelineEvent = catchAsync(async (req, res, next) => {
  const { event, description } = req.body;
  
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  // Add timeline event
  project.timeline.push({
    event,
    description,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(201).json({
    status: 'success',
    data: {
      timeline: project.timeline
    }
  });
});

/**
 * Get project team
 * @route GET /api/projects/:id/team
 * @access Private
 */
exports.getProjectTeam = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .select('team')
    .populate('team.userId', 'firstName lastName email phone role');
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      team: project.team
    }
  });
});

/**
 * Add team member
 * @route POST /api/projects/:id/team
 * @access Private (Contractors, Admins)
 */
exports.addTeamMember = catchAsync(async (req, res, next) => {
  const { userId, role, permissions } = req.body;
  
  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  // Check if user is already in team
  if (project.team.some(member => member.userId.toString() === userId)) {
    return next(new AppError('User is already a team member', 400));
  }
  
  // Add team member
  project.team.push({
    userId,
    role,
    permissions: permissions || []
  });
  
  // Add timeline event
  project.timeline.push({
    event: 'Team Member Added',
    description: `${user.firstName} ${user.lastName} added to project team as ${role}`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(201).json({
    status: 'success',
    data: {
      team: project.team
    }
  });
});

/**
 * Remove team member
 * @route DELETE /api/projects/:id/team/:memberId
 * @access Private (Contractors, Admins)
 */
exports.removeTeamMember = catchAsync(async (req, res, next) => {
  const { memberId } = req.params;
  
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  // Find team member
  const teamMember = project.team.find(member => member.userId.toString() === memberId);
  
  if (!teamMember) {
    return next(new AppError('No team member found with that ID', 404));
  }
  
  // Get user details for timeline
  const user = await User.findById(memberId);
  
  // Remove team member
  project.team = project.team.filter(member => member.userId.toString() !== memberId);
  
  // Add timeline event
  project.timeline.push({
    event: 'Team Member Removed',
    description: `${user.firstName} ${user.lastName} removed from project team`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      team: project.team
    }
  });
});

/**
 * Get project documents
 * @route GET /api/projects/:id/documents
 * @access Private
 */
exports.getProjectDocuments = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .select('documents')
    .populate('documents.uploadedBy', 'firstName lastName');
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      documents: project.documents
    }
  });
});

/**
 * Upload project document
 * @route POST /api/projects/:id/documents
 * @access Private
 */
exports.uploadProjectDocument = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.document) {
    return next(new AppError('Please upload a document', 400));
  }
  
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  const file = req.files.document;
  const { name, description, category } = req.body;
  
  // Upload file to S3
  const uploadResult = await uploadToS3(file, `projects/${project._id}/documents`);
  
  // Add document to project
  project.documents.push({
    name: name || file.name,
    description,
    category,
    fileUrl: uploadResult.Location,
    fileKey: uploadResult.Key,
    fileType: file.mimetype,
    fileSize: file.size,
    uploadedBy: req.user.id,
    uploadedAt: Date.now()
  });
  
  // Add timeline event
  project.timeline.push({
    event: 'Document Uploaded',
    description: `Document "${name || file.name}" uploaded to project`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(201).json({
    status: 'success',
    data: {
      document: project.documents[project.documents.length - 1]
    }
  });
});

/**
 * Delete project document
 * @route DELETE /api/projects/:id/documents/:documentId
 * @access Private (Contractors, Admins, Homeowners)
 */
exports.deleteProjectDocument = catchAsync(async (req, res, next) => {
  const { documentId } = req.params;
  
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  /
(Content truncated due to size limit. Use line ranges to read in chunks)