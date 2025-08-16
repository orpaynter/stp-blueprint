const mongoose = require('mongoose');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Claim = require('./claimModel');
const Assessment = require('../assessments/assessmentModel');
const Project = require('../projects/projectModel');
const User = require('../../auth/models/User');
const { uploadToS3, deleteFromS3 } = require('../../utils/s3Utils');
const fraudDetectorService = require('../../../agents/fraud_detector/fraud_detector');

/**
 * Get all claims (filtered by user role and permissions)
 * @route GET /api/claims
 * @access Private
 */
exports.getAllClaims = catchAsync(async (req, res, next) => {
  let filter = {};
  
  // Filter claims based on user role
  if (req.user.role === 'homeowner') {
    // Homeowners can only see their own claims
    filter.homeownerId = req.user.id;
  } else if (req.user.role === 'contractor') {
    // Contractors can see claims for projects they're assigned to
    filter.contractorId = req.user.id;
  } else if (req.user.role === 'insurance_agent') {
    // Insurance agents can see claims they're assigned to
    filter.insuranceAgentId = req.user.id;
  }
  // Admins can see all claims (no filter)
  
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
  let query = Claim.find(filter);
  
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
  
  // Execute query with population
  const claims = await query
    .populate('projectId', 'title address')
    .populate('assessmentId', 'title assessmentType')
    .populate('homeownerId', 'firstName lastName email')
    .populate('contractorId', 'firstName lastName email company')
    .populate('insuranceAgentId', 'firstName lastName email company');
  
  // Get total count for pagination
  const totalCount = await Claim.countDocuments(filter);
  
  res.status(200).json({
    status: 'success',
    results: claims.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    data: {
      claims
    }
  });
});

/**
 * Get claim by ID
 * @route GET /api/claims/:id
 * @access Private
 */
exports.getClaim = catchAsync(async (req, res, next) => {
  const claim = await Claim.findById(req.params.id)
    .populate('projectId', 'title address homeownerId contractorId')
    .populate('assessmentId', 'title assessmentType damageAnalysis costEstimate')
    .populate('homeownerId', 'firstName lastName email phone')
    .populate('contractorId', 'firstName lastName email phone company')
    .populate('insuranceAgentId', 'firstName lastName email phone company')
    .populate('submittedBy', 'firstName lastName email');
  
  if (!claim) {
    return next(new AppError('No claim found with that ID', 404));
  }
  
  // Check if user has access to this claim
  if (
    req.user.role !== 'admin' &&
    claim.homeownerId._id.toString() !== req.user.id &&
    claim.contractorId._id.toString() !== req.user.id &&
    (claim.insuranceAgentId && claim.insuranceAgentId._id.toString() !== req.user.id)
  ) {
    return next(new AppError('You do not have permission to access this claim', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      claim
    }
  });
});

/**
 * Create new claim
 * @route POST /api/claims
 * @access Private (Contractors, Admins, Homeowners, Insurance Agents)
 */
exports.createClaim = catchAsync(async (req, res, next) => {
  // Extract claim data from request body
  const {
    projectId,
    assessmentId,
    insuranceAgentId,
    policyNumber,
    damageType,
    damageExtent,
    estimatedCost,
    description,
    incidentDate
  } = req.body;
  
  // Validate project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Invalid project ID', 400));
  }
  
  // Check if user has permission to create claim for this project
  if (
    req.user.role !== 'admin' &&
    project.homeownerId.toString() !== req.user.id &&
    project.contractorId.toString() !== req.user.id &&
    !project.team.some(member => 
      member.userId.toString() === req.user.id && 
      member.permissions.includes('create:claim')
    )
  ) {
    return next(new AppError('You do not have permission to create a claim for this project', 403));
  }
  
  // Validate assessment if provided
  let assessment;
  if (assessmentId) {
    assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return next(new AppError('Invalid assessment ID', 400));
    }
    
    // Check if assessment belongs to the project
    if (assessment.projectId.toString() !== projectId) {
      return next(new AppError('Assessment does not belong to the specified project', 400));
    }
  }
  
  // Validate insurance agent if provided
  if (insuranceAgentId) {
    const insuranceAgent = await User.findById(insuranceAgentId);
    if (!insuranceAgent || insuranceAgent.role !== 'insurance_agent') {
      return next(new AppError('Invalid insurance agent ID', 400));
    }
  }
  
  // Create new claim
  const newClaim = await Claim.create({
    projectId,
    assessmentId,
    homeownerId: project.homeownerId,
    contractorId: project.contractorId,
    insuranceAgentId,
    policyNumber,
    damageType: damageType || (assessment && assessment.damageAnalysis ? assessment.damageAnalysis.damageType : undefined),
    damageExtent: damageExtent || (assessment && assessment.damageAnalysis ? assessment.damageAnalysis.damageExtent : undefined),
    estimatedCost: estimatedCost || (assessment && assessment.costEstimate ? assessment.costEstimate.totalCost : undefined),
    description,
    incidentDate,
    status: 'pending',
    submittedBy: req.user.id,
    submittedAt: Date.now(),
    statusHistory: [{
      status: 'pending',
      date: Date.now(),
      userId: req.user.id,
      notes: 'Claim submitted'
    }]
  });
  
  // If assessment provided, update it with claim reference
  if (assessment) {
    assessment.claimId = newClaim._id;
    assessment.status = 'claimed';
    await assessment.save();
  }
  
  // Add claim to project
  project.claims.push(newClaim._id);
  
  // Add timeline event
  project.timeline.push({
    event: 'Insurance Claim Created',
    description: `Insurance claim created for project`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(201).json({
    status: 'success',
    data: {
      claim: newClaim
    }
  });
});

/**
 * Update claim
 * @route PATCH /api/claims/:id
 * @access Private (Contractors, Admins, Insurance Agents)
 */
exports.updateClaim = catchAsync(async (req, res, next) => {
  // Find claim
  const claim = await Claim.findById(req.params.id);
  
  if (!claim) {
    return next(new AppError('No claim found with that ID', 404));
  }
  
  // Check if user has permission to update this claim
  if (
    req.user.role !== 'admin' &&
    claim.contractorId.toString() !== req.user.id &&
    (claim.insuranceAgentId && claim.insuranceAgentId.toString() !== req.user.id)
  ) {
    return next(new AppError('You do not have permission to update this claim', 403));
  }
  
  // Extract fields to update
  const {
    insuranceAgentId,
    policyNumber,
    damageType,
    damageExtent,
    estimatedCost,
    description,
    incidentDate,
    notes
  } = req.body;
  
  // Validate insurance agent if provided
  if (insuranceAgentId) {
    const insuranceAgent = await User.findById(insuranceAgentId);
    if (!insuranceAgent || insuranceAgent.role !== 'insurance_agent') {
      return next(new AppError('Invalid insurance agent ID', 400));
    }
  }
  
  // Update claim
  const updatedClaim = await Claim.findByIdAndUpdate(
    req.params.id,
    {
      insuranceAgentId,
      policyNumber,
      damageType,
      damageExtent,
      estimatedCost,
      description,
      incidentDate,
      notes,
      updatedBy: req.user.id,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  // Get project for timeline update
  const project = await Project.findById(claim.projectId);
  
  // Add timeline event
  project.timeline.push({
    event: 'Claim Updated',
    description: `Insurance claim updated`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      claim: updatedClaim
    }
  });
});

/**
 * Delete claim
 * @route DELETE /api/claims/:id
 * @access Private (Contractors, Admins, Insurance Agents)
 */
exports.deleteClaim = catchAsync(async (req, res, next) => {
  const claim = await Claim.findById(req.params.id);
  
  if (!claim) {
    return next(new AppError('No claim found with that ID', 404));
  }
  
  // Check if user has permission to delete this claim
  if (
    req.user.role !== 'admin' &&
    claim.contractorId.toString() !== req.user.id &&
    (claim.insuranceAgentId && claim.insuranceAgentId.toString() !== req.user.id)
  ) {
    return next(new AppError('You do not have permission to delete this claim', 403));
  }
  
  // Instead of hard delete, mark as inactive
  claim.active = false;
  claim.status = 'cancelled';
  
  // Add status history entry
  claim.statusHistory.push({
    status: 'cancelled',
    date: Date.now(),
    userId: req.user.id,
    notes: 'Claim cancelled'
  });
  
  await claim.save();
  
  // Get project for timeline update
  const project = await Project.findById(claim.projectId);
  
  // Add timeline event
  project.timeline.push({
    event: 'Claim Cancelled',
    description: `Insurance claim cancelled`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  // If claim has associated assessment, update it
  if (claim.assessmentId) {
    const assessment = await Assessment.findById(claim.assessmentId);
    if (assessment) {
      assessment.status = 'completed'; // or another appropriate status
      await assessment.save();
    }
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Claim successfully cancelled'
  });
});

/**
 * Upload claim document
 * @route POST /api/claims/:id/documents
 * @access Private
 */
exports.uploadClaimDocument = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.document) {
    return next(new AppError('Please upload a document', 400));
  }
  
  const claim = await Claim.findById(req.params.id);
  
  if (!claim) {
    return next(new AppError('No claim found with that ID', 404));
  }
  
  const file = req.files.document;
  const { name, description, category } = req.body;
  
  // Upload file to S3
  const uploadResult = await uploadToS3(file, `claims/${claim._id}/documents`);
  
  // Add document to claim
  claim.documents.push({
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
  
  await claim.save();
  
  // Get project for timeline update
  const project = await Project.findById(claim.projectId);
  
  // Add timeline event
  project.timeline.push({
    event: 'Claim Document Uploaded',
    description: `Document "${name || file.name}" uploaded to insurance claim`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(201).json({
    status: 'success',
    data: {
      document: claim.documents[claim.documents.length - 1]
    }
  });
});

/**
 * Get claim documents
 * @route GET /api/claims/:id/documents
 * @access Private
 */
exports.getClaimDocuments = catchAsync(async (req, res, next) => {
  const claim = await Claim.findById(req.params.id)
    .select('documents')
    .populate('documents.uploadedBy', 'firstName lastName');
  
  if (!claim) {
    return next(new AppError('No claim found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    results: claim.documents.length,
    data: {
      documents: claim.documents
    }
  });
});

/**
 * Delete claim document
 * @route DELETE /api/claims/:id/documents/:documentId
 * @access Private (Contractors, Admins, Insurance Agents, Homeowners)
 */
exports.deleteClaimDocument = catchAsync(async (req, res, next) => {
  const { documentId } = req.params;
  
  const claim = await Claim.findById(req.params.id);
  
  if (!claim) {
    return next(new AppError('No claim found with that ID', 404));
  }
  
  // Find document
  const document = claim.documents.id(documentId);
  
  if (!document) {
    return next(new AppError('No document found with that ID', 404));
  }
  
  // Check if user has permission to delete this document
  if (
    req.user.role !== 'admin' &&
    document.uploadedBy.toString() !== req.user.id &&
    claim.contractorId.toString() !== req.user.id &&
    claim.homeownerId.toString() !== req.user.id &&
    (claim.insuranceAgentId && claim.insuranceAgentId.toString() !== req.user.id)
  ) {
    return next(new AppError('You do not have permission to delete this document', 403));
  }
  
  // Delete file from S3
  await deleteFromS3(document.fileKey);
  
  // Remove document from claim
  document.remove();
  
  await claim.save();
  
  // Get project for timeline update
  const project = await Project.findById(claim.projectId);
  
  // Add timeline event
  project.timeline.push({
    event: 'Claim Document Deleted',
    description: `Document "${document.name}" deleted from insurance claim`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Document successfully deleted'
  });
});

/**
 * Verify claim
 * @route POST /api/claims/:id/verify
 * @access Private (Insurance Agents, Admins)
 */
exports.verifyClaim = catchAsync(async (req, res, next) => {
  const { verificationNotes } = req.body;
  
  const claim = await Claim.findById(req.params.id);
  
  if (!claim) {
    return next(new AppError('No claim found with that ID', 404));
  }
  
  // Update claim status
  claim.status = 'verified';
  claim.verifiedBy = req.user.id;
  claim.verifiedAt = Date.now();
  claim.verificationNotes = verificationNotes;
  
  // Add status history entry
  claim.statusHistory.push({
    status: 'verified',
    date: Date.now(),
    userId: req.user.id,
    notes: verificationNotes || 'Claim verified'
  });
  
  await claim.save();
  
  // Get project for timeline update
  const project = await Project.findById(claim.projectId);
  
  // Add timeline event
  project.timeline.push({
    event: 'Claim Verified',
    description: `Insurance claim verified`,
    date: Date.now(),
    userId: req.user.id
  });
  
  await project.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      claim
    }
  });
});

/**
 * Approve claim
 * @route POST /api/claims/:id/approve
 * @access Private (Insurance Agents, Admins)
 */
exports.approveClaim = catchAsync(async (req, res, next) => {
  const { approvalNotes, approvedAmount } = req.body;
  
  if (!approvedAmount) {
    return next(new AppError('Approved amount is required', 400));
  }
  
  const claim = await Cla
(Content truncated due to size limit. Use line ranges to read in chunks)