const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const auth = require('../../user-service/middleware/auth');

// @route   POST api/payments
// @desc    Create a new payment
// @access  Private
router.post('/', [
  auth,
  [
    check('invoiceId', 'Invoice ID is required').not().isEmpty(),
    check('amount', 'Amount is required').isNumeric(),
    check('paymentMethod', 'Payment method is required').isIn(['credit_card', 'bank_transfer', 'paypal', 'stripe', 'check', 'cash', 'insurance', 'other'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Find the invoice
    const invoice = await Invoice.findById(req.body.invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }

    // Check if user is the payer (recipient of the invoice)
    if (req.user.id !== invoice.recipientId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to make payment for this invoice' });
    }

    const {
      invoiceId,
      amount,
      paymentMethod,
      transactionId,
      notes,
      metadata
    } = req.body;

    // Create new payment
    const newPayment = new Payment({
      invoiceId,
      payerId: req.user.id,
      recipientId: invoice.issuerId,
      amount,
      currency: invoice.currency,
      status: 'processing', // Initially set to processing
      paymentMethod,
      paymentDate: new Date(),
      transactionId,
      notes,
      metadata
    });

    const payment = await newPayment.save();
    
    // In a real implementation, we would process the payment through a payment gateway here
    // For now, we'll simulate a successful payment
    
    // Update payment status to completed
    payment.status = 'completed';
    await payment.save();
    
    // Update invoice
    invoice.amountPaid += amount;
    invoice.balance = invoice.total - invoice.amountPaid;
    invoice.payments.push({
      paymentId: payment._id,
      amount,
      date: new Date(),
      method: paymentMethod
    });
    
    // Update invoice status based on payment amount
    if (invoice.balance <= 0) {
      invoice.status = 'paid';
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'partially_paid';
    }
    
    await invoice.save();
    
    res.json({ payment, invoice });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/payments
// @desc    Get all payments for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let payments;
    
    // Filter payments based on user role and query params
    const { role } = req.query;
    
    if (role === 'payer') {
      // Get payments where user is payer
      payments = await Payment.find({ payerId: req.user.id })
        .sort({ createdAt: -1 });
    } else if (role === 'recipient') {
      // Get payments where user is recipient
      payments = await Payment.find({ recipientId: req.user.id })
        .sort({ createdAt: -1 });
    } else {
      // Get all payments related to user
      payments = await Payment.find({
        $or: [
          { payerId: req.user.id },
          { recipientId: req.user.id }
        ]
      }).sort({ createdAt: -1 });
    }
    
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/payments/invoice/:invoiceId
// @desc    Get all payments for an invoice
// @access  Private
router.get('/invoice/:invoiceId', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }

    // Check if user has access to this invoice
    const hasAccess = 
      req.user.id === invoice.issuerId.toString() || 
      req.user.id === invoice.recipientId.toString();
    
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to access payments for this invoice' });
    }

    const payments = await Payment.find({ invoiceId: req.params.invoiceId })
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/payments/:id
// @desc    Get payment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    // Check if user has access to this payment
    const hasAccess = 
      req.user.id === payment.payerId.toString() || 
      req.user.id === payment.recipientId.toString();
    
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to access this payment' });
    }

    res.json(payment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/payments/:id/refund
// @desc    Refund a payment
// @access  Private
router.post('/:id/refund', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    // Check if user is the recipient (the one who can issue refunds)
    if (req.user.id !== payment.recipientId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to refund this payment' });
    }

    // Check if payment can be refunded
    if (payment.status !== 'completed') {
      return res.status(400).json({ msg: `Payment cannot be refunded because it is in ${payment.status} status` });
    }

    // Update payment status to refunded
    payment.status = 'refunded';
    await payment.save();
    
    // Update invoice
    const invoice = await Invoice.findById(payment.invoiceId);
    if (invoice) {
      invoice.amountPaid -= payment.amount;
      invoice.balance = invoice.total - invoice.amountPaid;
      
      // Update invoice status based on payment amount
      if (invoice.amountPaid <= 0) {
        invoice.status = 'sent';
      } else {
        invoice.status = 'partially_paid';
      }
      
      await invoice.save();
    }
    
    res.json({ payment, invoice });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
