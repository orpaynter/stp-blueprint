const mongoose = require('mongoose');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Payment = require('./paymentModel');
const Invoice = require('./invoiceModel');
const Project = require('../projects/projectModel');
const User = require('../../auth/models/User');
const Claim = require('../claims/claimModel');
const stripeService = require('../../../integrations/stripe/src/stripe-service');

/**
 * Get all payments (filtered by user role and permissions)
 * @route GET /api/payments
 * @access Private
 */
exports.getAllPayments = catchAsync(async (req, res, next) => {
  let filter = {};
  
  // Filter payments based on user role
  if (req.user.role === 'homeowner') {
    // Homeowners can only see payments they made
    filter.payerId = req.user.id;
  } else if (req.user.role === 'contractor') {
    // Contractors can see payments they received
    filter.payeeId = req.user.id;
  } else if (req.user.role === 'insurance_agent') {
    // Insurance agents can see payments they initiated
    filter.createdBy = req.user.id;
  }
  // Admins can see all payments (no filter)
  
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
  let query = Payment.find(filter);
  
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
  const payments = await query
    .populate('projectId', 'title address')
    .populate('claimId', 'policyNumber damageType')
    .populate('invoiceId', 'invoiceNumber amount')
    .populate('payerId', 'firstName lastName email')
    .populate('payeeId', 'firstName lastName email company');
  
  // Get total count for pagination
  const totalCount = await Payment.countDocuments(filter);
  
  res.status(200).json({
    status: 'success',
    results: payments.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    data: {
      payments
    }
  });
});

/**
 * Get payment by ID
 * @route GET /api/payments/:id
 * @access Private
 */
exports.getPayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate('projectId', 'title address homeownerId contractorId')
    .populate('claimId', 'policyNumber damageType status')
    .populate('invoiceId', 'invoiceNumber amount dueDate')
    .populate('payerId', 'firstName lastName email phone')
    .populate('payeeId', 'firstName lastName email phone company')
    .populate('createdBy', 'firstName lastName email');
  
  if (!payment) {
    return next(new AppError('No payment found with that ID', 404));
  }
  
  // Check if user has access to this payment
  if (
    req.user.role !== 'admin' &&
    payment.payerId._id.toString() !== req.user.id &&
    payment.payeeId._id.toString() !== req.user.id &&
    payment.createdBy._id.toString() !== req.user.id
  ) {
    return next(new AppError('You do not have permission to access this payment', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      payment
    }
  });
});

/**
 * Create new payment
 * @route POST /api/payments
 * @access Private (Contractors, Admins, Insurance Agents)
 */
exports.createPayment = catchAsync(async (req, res, next) => {
  // Extract payment data from request body
  const {
    projectId,
    claimId,
    invoiceId,
    payerId,
    payeeId,
    amount,
    currency,
    paymentMethod,
    description,
    notes
  } = req.body;
  
  if (!amount || amount <= 0) {
    return next(new AppError('Valid payment amount is required', 400));
  }
  
  if (!payerId || !payeeId) {
    return next(new AppError('Payer and payee are required', 400));
  }
  
  // Validate project if provided
  if (projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Invalid project ID', 400));
    }
  }
  
  // Validate claim if provided
  if (claimId) {
    const claim = await Claim.findById(claimId);
    if (!claim) {
      return next(new AppError('Invalid claim ID', 400));
    }
    
    // Check if claim is approved
    if (claim.status !== 'approved' && claim.status !== 'payment_initiated') {
      return next(new AppError('Claim must be approved before creating payment', 400));
    }
  }
  
  // Validate invoice if provided
  if (invoiceId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return next(new AppError('Invalid invoice ID', 400));
    }
    
    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return next(new AppError('Invoice is already paid', 400));
    }
  }
  
  // Create new payment
  const newPayment = await Payment.create({
    projectId,
    claimId,
    invoiceId,
    payerId,
    payeeId,
    amount,
    currency: currency || 'USD',
    paymentMethod: paymentMethod || 'bank_transfer',
    description,
    notes,
    status: 'pending',
    createdBy: req.user.id,
    createdAt: Date.now()
  });
  
  // Update related entities
  
  // If claim provided, update it
  if (claimId) {
    const claim = await Claim.findById(claimId);
    claim.paymentId = newPayment._id;
    claim.status = 'payment_initiated';
    
    // Add status history entry
    claim.statusHistory.push({
      status: 'payment_initiated',
      date: Date.now(),
      userId: req.user.id,
      notes: `Payment initiated: ${amount} ${currency || 'USD'}`
    });
    
    await claim.save();
  }
  
  // If invoice provided, update it
  if (invoiceId) {
    const invoice = await Invoice.findById(invoiceId);
    invoice.paymentId = newPayment._id;
    invoice.status = 'payment_pending';
    await invoice.save();
  }
  
  // If project provided, update it
  if (projectId) {
    const project = await Project.findById(projectId);
    project.payments.push(newPayment._id);
    
    // Add timeline event
    project.timeline.push({
      event: 'Payment Created',
      description: `Payment of ${amount} ${currency || 'USD'} created`,
      date: Date.now(),
      userId: req.user.id
    });
    
    await project.save();
  }
  
  res.status(201).json({
    status: 'success',
    data: {
      payment: newPayment
    }
  });
});

/**
 * Update payment
 * @route PATCH /api/payments/:id
 * @access Private (Contractors, Admins, Insurance Agents)
 */
exports.updatePayment = catchAsync(async (req, res, next) => {
  // Find payment
  const payment = await Payment.findById(req.params.id);
  
  if (!payment) {
    return next(new AppError('No payment found with that ID', 404));
  }
  
  // Check if user has permission to update this payment
  if (
    req.user.role !== 'admin' &&
    payment.createdBy.toString() !== req.user.id &&
    (req.user.role === 'contractor' && payment.payeeId.toString() !== req.user.id) &&
    (req.user.role === 'insurance_agent' && payment.payerId.toString() !== req.user.id)
  ) {
    return next(new AppError('You do not have permission to update this payment', 403));
  }
  
  // Check if payment can be updated
  if (payment.status === 'completed' || payment.status === 'failed') {
    return next(new AppError(`Payment cannot be updated in ${payment.status} status`, 400));
  }
  
  // Extract fields to update
  const {
    paymentMethod,
    description,
    notes,
    externalReference
  } = req.body;
  
  // Update payment
  const updatedPayment = await Payment.findByIdAndUpdate(
    req.params.id,
    {
      paymentMethod,
      description,
      notes,
      externalReference,
      updatedBy: req.user.id,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  // If project exists, add timeline event
  if (payment.projectId) {
    const project = await Project.findById(payment.projectId);
    if (project) {
      // Add timeline event
      project.timeline.push({
        event: 'Payment Updated',
        description: `Payment of ${payment.amount} ${payment.currency} updated`,
        date: Date.now(),
        userId: req.user.id
      });
      
      await project.save();
    }
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      payment: updatedPayment
    }
  });
});

/**
 * Delete payment
 * @route DELETE /api/payments/:id
 * @access Private (Admins, Insurance Agents)
 */
exports.deletePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);
  
  if (!payment) {
    return next(new AppError('No payment found with that ID', 404));
  }
  
  // Check if user has permission to delete this payment
  if (
    req.user.role !== 'admin' &&
    (req.user.role === 'insurance_agent' && payment.createdBy.toString() !== req.user.id)
  ) {
    return next(new AppError('You do not have permission to delete this payment', 403));
  }
  
  // Check if payment can be deleted
  if (payment.status === 'completed') {
    return next(new AppError('Completed payments cannot be deleted', 400));
  }
  
  // Instead of hard delete, mark as cancelled
  payment.status = 'cancelled';
  payment.updatedBy = req.user.id;
  payment.updatedAt = Date.now();
  await payment.save();
  
  // Update related entities
  
  // If claim exists, update it
  if (payment.claimId) {
    const claim = await Claim.findById(payment.claimId);
    if (claim) {
      claim.paymentId = null;
      claim.status = 'approved'; // Revert to approved status
      
      // Add status history entry
      claim.statusHistory.push({
        status: 'approved',
        date: Date.now(),
        userId: req.user.id,
        notes: 'Payment cancelled, claim reverted to approved status'
      });
      
      await claim.save();
    }
  }
  
  // If invoice exists, update it
  if (payment.invoiceId) {
    const invoice = await Invoice.findById(payment.invoiceId);
    if (invoice) {
      invoice.paymentId = null;
      invoice.status = 'unpaid';
      await invoice.save();
    }
  }
  
  // If project exists, add timeline event
  if (payment.projectId) {
    const project = await Project.findById(payment.projectId);
    if (project) {
      // Add timeline event
      project.timeline.push({
        event: 'Payment Cancelled',
        description: `Payment of ${payment.amount} ${payment.currency} cancelled`,
        date: Date.now(),
        userId: req.user.id
      });
      
      await project.save();
    }
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Payment successfully cancelled'
  });
});

/**
 * Process payment
 * @route POST /api/payments/:id/process
 * @access Private (Contractors, Admins, Insurance Agents)
 */
exports.processPayment = catchAsync(async (req, res, next) => {
  const { paymentMethodId, savePaymentMethod } = req.body;
  
  const payment = await Payment.findById(req.params.id)
    .populate('payerId', 'firstName lastName email stripeCustomerId')
    .populate('payeeId', 'firstName lastName email stripeAccountId');
  
  if (!payment) {
    return next(new AppError('No payment found with that ID', 404));
  }
  
  // Check if payment can be processed
  if (payment.status !== 'pending') {
    return next(new AppError(`Payment cannot be processed in ${payment.status} status`, 400));
  }
  
  // Process payment through Stripe
  try {
    const paymentResult = await stripeService.processPayment({
      amount: payment.amount,
      currency: payment.currency,
      paymentMethodId,
      customerId: payment.payerId.stripeCustomerId,
      description: payment.description || `Payment for ${payment.projectId ? 'project' : payment.claimId ? 'claim' : 'invoice'}`,
      metadata: {
        paymentId: payment._id.toString(),
        projectId: payment.projectId ? payment.projectId.toString() : null,
        claimId: payment.claimId ? payment.claimId.toString() : null,
        invoiceId: payment.invoiceId ? payment.invoiceId.toString() : null
      },
      savePaymentMethod: savePaymentMethod || false
    });
    
    // Update payment with Stripe data
    payment.status = 'completed';
    payment.externalReference = paymentResult.id;
    payment.processingFee = paymentResult.fee;
    payment.processedAt = Date.now();
    payment.receiptUrl = paymentResult.receiptUrl;
    payment.updatedBy = req.user.id;
    payment.updatedAt = Date.now();
    
    await payment.save();
    
    // Update related entities
    
    // If claim exists, update it
    if (payment.claimId) {
      const claim = await Claim.findById(payment.claimId);
      if (claim) {
        claim.status = 'payment_completed';
        
        // Add status history entry
        claim.statusHistory.push({
          status: 'payment_completed',
          date: Date.now(),
          userId: req.user.id,
          notes: `Payment completed: ${payment.amount} ${payment.currency}`
        });
        
        await claim.save();
      }
    }
    
    // If invoice exists, update it
    if (payment.invoiceId) {
      const invoice = await Invoice.findById(payment.invoiceId);
      if (invoice) {
        invoice.status = 'paid';
        invoice.paidAt = Date.now();
        await invoice.save();
      }
    }
    
    // If project exists, add timeline event
    if (payment.projectId) {
      const project = await Project.findById(payment.projectId);
      if (project) {
        // Add timeline event
        project.timeline.push({
          event: 'Payment Completed',
          description: `Payment of ${payment.amount} ${payment.currency} completed`,
          date: Date.now(),
          userId: req.user.id
        });
        
        await project.save();
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        payment,
        receipt: paymentResult.receiptUrl
      }
    });
  } catch (err) {
    // Update payment with error
    payment.status = 'failed';
    payment.failureReason = err.message;
    payment.updatedBy = req.user.id;
    payment.updatedAt = Date.now();
    
    await payment.save();
    
    return next(new AppError(`Payment processing failed: ${err.message}`, 400));
  }
});

/**
 * Create invoice
 * @route POST /api/payments/invoices
 * @access Private (Contractors, Admins)
 */
exports.createInvoice = catchAsync(async (req, res, next) => {
  // Extract invoice data from request body
  const {
    projectId,
    claimId,
    recipientId,
    amount,
    currency,
    dueDate,
    items,
    notes
  } = req.body;
  
  if (!amount || amount <= 0) {
    return next(new AppError('Valid invoice amount is required', 400));
  }
  
  if (!recipientId) {
    return next(new AppError('Recipient is required', 400));
  }
  
  // Validate project if provided
  if (projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Invalid project ID', 400));
    }
    
    // Check if user has permission to create invoice for this project
    if (
      req.user.role !== 'admin' &&
      project.contractorId.toString() !== req.user.id &&
      !project.team.some(member => 
        member.userId.toString() === req.user.id && 
        member.permissions.includes('create:invoice')
      )
    ) {
      return n
(Content truncated due to size limit. Use line ranges to read in chunks)