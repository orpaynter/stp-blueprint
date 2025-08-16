const mongoose = require('mongoose');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Assessment = require('./assessmentModel');
const Project = require('../projects/projectModel');
const User = require('../../auth/models/User');
const { uploadToS3, deleteFromS3 } = require('../../utils/s3Utils');
const damageAssessorService = require('../../../agents/damage_assessor/damage_assessor');
const costEstimatorService = require('../../../agents/cost_estimator/cost_estimator');

/**
 * Get all assessments (filtered by user role and permissions)
 * @route GET /api/assessments
 * @access Private
 */
exports.getAllAssessments = catchAsync(async (req, res, next) => {
  let filter = {};
  
  // Filter assessments based on user role
  if (req.user.role === 'homeowner') {
    // Homeowners can only see assessments for their projects
    const projects = await Project.find({ homeownerId: req.user.id }).select('_id');
    const projectIds = projects.map(project => project._id);
    filter.projectId = { $in: projectIds };
  } else if (req.user.role === 'contractor') {
    // Contractors can see assessments for projects they're assigned to
    const projects = await Project.find({ contractorId: req.user.id }).select('_id');
    const projectIds = projects.map(project => project._id);
    filter.projectId = { $in: projectIds };
  } else if (req.user.role === 'insurance_agent') {
    // Insurance agents can see assessments they're assigned to
    filter.insuranceAgentId = req.user.id;
  }
  // Admins can see all assessments (no filter)
  
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
  let query = Assessment.find(filter);
  
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
  const assessments = await query.populate('projectId', 'title address');
  
  // Get total count for pagination
  const totalCount = await Assessment.countDocuments(filter);
  
  res.status(200).json({
    status: 'success',
    results: assessments.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    data: {
      assessments
    }
  });
});

/**
 * Get assessment by ID
 * @route GET /api/assessments/:id
 * @access Private
 */
exports.getAssessment = catchAsync(async (req, res, next) => {
  const assessment = await Assessment.findById(req.params.id)
    .populate('projectId', 'title address homeownerId contractorId')
    .populate('createdBy', 'firstName lastName email')
    .populate('insuranceAgentId', 'firstName lastName email company');
  
  if (!assessment) {
    return next(new AppError('No assessment found with that ID', 404));
  }
  
  // Check if user has access to this assessment
  const project = await Project.findById(assessment.projectId);
  
  if (
    req.user.role !== 'admin' &&
    project.homeownerId.toString() !== req.user.id &&
    project.contractorId.toString() !== req.user.id &&
    assessment.insuranceAgentId && assessment.insuranceAgentId._id.toString() !== req.user.id &&
    !project.team.some(member => member.userId.toString() === req.user.id)
  ) {
    return next(new AppError('You do not have permission to access this assessment', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      assessment
    }
  });
});

/**
 * Create new assessment
 * @route POST /api/assessments
 * @access Private (Contractors, Admins)
 */
exports.createAssessment = catchAsync(async (req, res, next) => {
  // Extract assessment data from request body
  const {
    projectId,
    title,
    description,
    assessmentType,
    insuranceAgentId,
    assessmentDate
  } = req.body;
  
  // Validate project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Invalid project ID', 400));
  }
  
  // Check if user has permission to create assessment for this project
  if (
    req.user.role !== 'admin' &&
    project.contractorId.toString() !== req.user.id &&
    !project.team.some(member => 
      member.userId.toString() === req.user.id && 
      member.permissions.includes('create:assessment')
    )
  ) {
    return next(new AppError('You do not have permission to create an assessment for this project', 403));
  }
  
  // Validate insurance agent if provided
  if (insuranceAgentId) {
    const insuranceAgent = await User.findById(insuranceAgentId);
    if (!insuranceAgent || insuranceAgent.role !== 'insurance_agent') {
      return next(new AppError('Invalid insurance agent ID', 400));
    }
  }
  
  // Create new assessment
  const newAssessment = await Assessment.create({
    projectId,
    title,
    description,
    assessmentType,
    insuranceAgentId,
    assessmentDate: assessmentDate || Date.now(),
    createdBy: req.user.id,
    status: 'pending'
  });
  
  // Add assessment to project
  project.assessments.push(newAssessment._id);
  
  // Add timeline event
  project.timeline.push({
    event: 'Assessment Created',
    description: `Assessment "${title}" has been created`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(201).json({
    status: 'success',
    data: {
      assessment: newAssessment
    }
  });
});

/**
 * Update assessment
 * @route PATCH /api/assessments/:id
 * @access Private (Contractors, Admins)
 */
exports.updateAssessment = catchAsync(async (req, res, next) => {
  // Find assessment
  const assessment = await Assessment.findById(req.params.id);
  
  if (!assessment) {
    return next(new AppError('No assessment found with that ID', 404));
  }
  
  // Check if user has permission to update this assessment
  const project = await Project.findById(assessment.projectId);
  
  if (
    req.user.role !== 'admin' &&
    project.contractorId.toString() !== req.user.id &&
    !project.team.some(member => 
      member.userId.toString() === req.user.id && 
      member.permissions.includes('update:assessment')
    )
  ) {
    return next(new AppError('You do not have permission to update this assessment', 403));
  }
  
  // Extract fields to update
  const {
    title,
    description,
    assessmentType,
    insuranceAgentId,
    assessmentDate,
    status,
    notes
  } = req.body;
  
  // Validate insurance agent if provided
  if (insuranceAgentId) {
    const insuranceAgent = await User.findById(insuranceAgentId);
    if (!insuranceAgent || insuranceAgent.role !== 'insurance_agent') {
      return next(new AppError('Invalid insurance agent ID', 400));
    }
  }
  
  // Update assessment
  const updatedAssessment = await Assessment.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      assessmentType,
      insuranceAgentId,
      assessmentDate,
      status,
      notes,
      updatedBy: req.user.id,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  // Add timeline event for status change
  if (status && status !== assessment.status) {
    project.timeline.push({
      event: 'Assessment Status Updated',
      description: `Assessment "${assessment.title}" status changed from ${assessment.status} to ${status}`,
      date: Date.now(),
      userId: req.user.id
    });
    
    await project.save();
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      assessment: updatedAssessment
    }
  });
});

/**
 * Delete assessment
 * @route DELETE /api/assessments/:id
 * @access Private (Contractors, Admins)
 */
exports.deleteAssessment = catchAsync(async (req, res, next) => {
  const assessment = await Assessment.findById(req.params.id);
  
  if (!assessment) {
    return next(new AppError('No assessment found with that ID', 404));
  }
  
  // Check if user has permission to delete this assessment
  const project = await Project.findById(assessment.projectId);
  
  if (
    req.user.role !== 'admin' &&
    project.contractorId.toString() !== req.user.id &&
    !project.team.some(member => 
      member.userId.toString() === req.user.id && 
      member.permissions.includes('delete:assessment')
    )
  ) {
    return next(new AppError('You do not have permission to delete this assessment', 403));
  }
  
  // Instead of hard delete, mark as inactive
  assessment.active = false;
  assessment.status = 'cancelled';
  await assessment.save();
  
  // Add timeline event
  project.timeline.push({
    event: 'Assessment Cancelled',
    description: `Assessment "${assessment.title}" has been cancelled`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Assessment successfully cancelled'
  });
});

/**
 * Upload assessment image
 * @route POST /api/assessments/:id/images
 * @access Private
 */
exports.uploadAssessmentImage = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.image) {
    return next(new AppError('Please upload an image', 400));
  }
  
  const assessment = await Assessment.findById(req.params.id);
  
  if (!assessment) {
    return next(new AppError('No assessment found with that ID', 404));
  }
  
  const file = req.files.image;
  const { description, category } = req.body;
  
  // Validate file is an image
  if (!file.mimetype.startsWith('image')) {
    return next(new AppError('Please upload an image file', 400));
  }
  
  // Upload file to S3
  const uploadResult = await uploadToS3(file, `assessments/${assessment._id}/images`);
  
  // Add image to assessment
  assessment.images.push({
    url: uploadResult.Location,
    key: uploadResult.Key,
    description,
    category,
    uploadedBy: req.user.id,
    uploadedAt: Date.now()
  });
  
  await assessment.save();
  
  // Get project for timeline update
  const project = await Project.findById(assessment.projectId);
  
  // Add timeline event
  project.timeline.push({
    event: 'Assessment Image Uploaded',
    description: `Image uploaded to assessment "${assessment.title}"`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(201).json({
    status: 'success',
    data: {
      image: assessment.images[assessment.images.length - 1]
    }
  });
});

/**
 * Get assessment images
 * @route GET /api/assessments/:id/images
 * @access Private
 */
exports.getAssessmentImages = catchAsync(async (req, res, next) => {
  const assessment = await Assessment.findById(req.params.id)
    .select('images')
    .populate('images.uploadedBy', 'firstName lastName');
  
  if (!assessment) {
    return next(new AppError('No assessment found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    results: assessment.images.length,
    data: {
      images: assessment.images
    }
  });
});

/**
 * Delete assessment image
 * @route DELETE /api/assessments/:id/images/:imageId
 * @access Private (Contractors, Admins)
 */
exports.deleteAssessmentImage = catchAsync(async (req, res, next) => {
  const { imageId } = req.params;
  
  const assessment = await Assessment.findById(req.params.id);
  
  if (!assessment) {
    return next(new AppError('No assessment found with that ID', 404));
  }
  
  // Find image
  const image = assessment.images.id(imageId);
  
  if (!image) {
    return next(new AppError('No image found with that ID', 404));
  }
  
  // Check if user has permission to delete this image
  const project = await Project.findById(assessment.projectId);
  
  if (
    req.user.role !== 'admin' &&
    project.contractorId.toString() !== req.user.id &&
    image.uploadedBy.toString() !== req.user.id &&
    !project.team.some(member => 
      member.userId.toString() === req.user.id && 
      member.permissions.includes('update:assessment')
    )
  ) {
    return next(new AppError('You do not have permission to delete this image', 403));
  }
  
  // Delete file from S3
  await deleteFromS3(image.key);
  
  // Remove image from assessment
  image.remove();
  
  await assessment.save();
  
  // Add timeline event
  project.timeline.push({
    event: 'Assessment Image Deleted',
    description: `Image deleted from assessment "${assessment.title}"`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Image successfully deleted'
  });
});

/**
 * Analyze damage
 * @route POST /api/assessments/:id/analyze-damage
 * @access Private (Contractors, Admins, Insurance Agents)
 */
exports.analyzeDamage = catchAsync(async (req, res, next) => {
  const assessment = await Assessment.findById(req.params.id);
  
  if (!assessment) {
    return next(new AppError('No assessment found with that ID', 404));
  }
  
  // Check if assessment has images
  if (!assessment.images || assessment.images.length === 0) {
    return next(new AppError('Assessment has no images to analyze', 400));
  }
  
  // Get image URLs for analysis
  const imageUrls = assessment.images.map(image => image.url);
  
  // Use damage assessor agent to analyze images
  try {
    const damageAnalysis = await damageAssessorService.analyzeDamage({
      assessmentId: assessment._id,
      projectId: assessment.projectId,
      imageUrls
    });
    
    // Update assessment with damage analysis
    assessment.damageAnalysis = damageAnalysis;
    assessment.status = 'analyzed';
    assessment.updatedBy = req.user.id;
    assessment.updatedAt = Date.now();
    
    await assessment.save();
    
    // Get project for timeline update
    const project = await Project.findById(assessment.projectId);
    
    // Add timeline event
    project.timeline.push({
      event: 'Damage Analysis Completed',
      description: `Damage analysis completed for assessment "${assessment.title}"`,
      date: Date.now(),
      userId: req.user.id
    });
    
    await project.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        damageAnalysis: assessment.damageAnalysis
      }
    });
  } catch (err) {
    return next(new AppError(`Failed to analyze damage: ${err.message}`, 500));
  }
});

/**
 * Get damage analysis
 * @route GET /api/assessments/:id/damage-analysis
 * @access Private
 */
exports.getDamageAnalysis = catchAsync(async (req, res, next) => {
  const assessment = await Assessment.findById(req.params.id)
    .select('damageAnalysis');
  
  if (!assessment) {
    return next(new AppError('No assessment found with that ID', 404));
  }
  
  if (!assessment.damageAnalysis) {
    return next(new AppError('No damage analysis found for this assessment', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      damageAnalysis: assessment.damageAnalysis
    }
  });
});

/**
 * Generate cost estimate
 * @route POST /api/assessments/:id/cost-estimate
 * @access Private (Contractors, Admins)
 */
exports.generateCostEstimate = catchAsync(async (req, res, next) => {
  const assessment = await Assessment.findById(req.params.id);
  
  if (!assessment) {
    return next(new AppError('No assessment found with that ID', 404));
  }
  
  // Check if damage analysis exists
  if (!a
(Content truncated due to size limit. Use line ranges to read in chunks)