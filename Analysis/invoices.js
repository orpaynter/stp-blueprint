const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const auth = require('../../user-service/middleware/auth');

// @route   POST api/invoices
// @desc    Create a new invoice
// @access  Private
router.post('/', [
  auth,
  [
    check('projectId', 'Project ID is required').not().isEmpty(),
    check('recipientId', 'Recipient ID is required').not().isEmpty(),
    check('dueDate', 'Due date is required').not().isEmpty(),
    check('items', 'Items are required').isArray().not().isEmpty(),
    check('subtotal', 'Subtotal is required').isNumeric(),
    check('total', 'Total is required').isNumeric()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      projectId,
      claimId,
      recipientId,
      dueDate,
      items,
      subtotal,
      taxTotal,
      discountTotal,
      total,
      currency,
      notes,
      terms,
      paymentInstructions
    } = req.body;

    // Create new invoice
    const newInvoice = new Invoice({
      projectId,
      claimId,
      invoiceNumber: null, // Will be generated in pre-save hook
      issuerId: req.user.id,
      recipientId,
      dueDate,
      items,
      subtotal,
      taxTotal: taxTotal || 0,
      discountTotal: discountTotal || 0,
      total,
      balance: total, // Initially, balance equals total
      currency: currency || 'USD',
      notes,
      terms,
      paymentInstructions
    });

    const invoice = await newInvoice.save();
    
    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/invoices
// @desc    Get all invoices for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let invoices;
    
    // Filter invoices based on user role and query params
    const { role } = req.query;
    
    if (role === 'recipient') {
      // Get invoices where user is recipient
      invoices = await Invoice.find({ recipientId: req.user.id })
        .sort({ createdAt: -1 });
    } else if (role === 'issuer') {
      // Get invoices where user is issuer
      invoices = await Invoice.find({ issuerId: req.user.id })
        .sort({ createdAt: -1 });
    } else {
      // Get all invoices related to user
      invoices = await Invoice.find({
        $or: [
          { issuerId: req.user.id },
          { recipientId: req.user.id }
        ]
      }).sort({ createdAt: -1 });
    }
    
    res.json(invoices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/invoices/project/:projectId
// @desc    Get all invoices for a project
// @access  Private
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 });
    
    res.json(invoices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/invoices/:id
// @desc    Get invoice by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }

    // Check if user has access to this invoice
    const hasAccess = 
      req.user.id === invoice.issuerId.toString() || 
      req.user.id === invoice.recipientId.toString();
    
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to access this invoice' });
    }

    // If recipient is viewing, update status to 'viewed' if it's currently 'sent'
    if (req.user.id === invoice.recipientId.toString() && invoice.status === 'sent') {
      invoice.status = 'viewed';
      await invoice.save();
    }

    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/invoices/:id
// @desc    Update an invoice
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }

    // Check if user is the issuer
    if (req.user.id !== invoice.issuerId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to update this invoice' });
    }

    // Check if invoice can be updated (only draft invoices can be updated)
    if (invoice.status !== 'draft') {
      return res.status(400).json({ msg: `Invoice cannot be updated because it is in ${invoice.status} status` });
    }

    // Update fields
    const {
      dueDate,
      items,
      subtotal,
      taxTotal,
      discountTotal,
      total,
      currency,
      notes,
      terms,
      paymentInstructions
    } = req.body;

    if (dueDate) invoice.dueDate = dueDate;
    if (items) invoice.items = items;
    if (subtotal) invoice.subtotal = subtotal;
    if (taxTotal !== undefined) invoice.taxTotal = taxTotal;
    if (discountTotal !== undefined) invoice.discountTotal = discountTotal;
    if (total) {
      invoice.total = total;
      invoice.balance = total - invoice.amountPaid;
    }
    if (currency) invoice.currency = currency;
    if (notes) invoice.notes = notes;
    if (terms) invoice.terms = terms;
    if (paymentInstructions) invoice.paymentInstructions = paymentInstructions;

    await invoice.save();
    
    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/invoices/:id/send
// @desc    Send an invoice (change status from draft to sent)
// @access  Private
router.post('/:id/send', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }

    // Check if user is the issuer
    if (req.user.id !== invoice.issuerId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to send this invoice' });
    }

    // Check if invoice is in draft status
    if (invoice.status !== 'draft') {
      return res.status(400).json({ msg: `Invoice cannot be sent because it is in ${invoice.status} status` });
    }

    // Update status to sent
    invoice.status = 'sent';
    await invoice.save();
    
    // In a real implementation, we would send an email notification here
    
    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/invoices/:id
// @desc    Delete an invoice
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }

    // Check if user is the issuer
    if (req.user.id !== invoice.issuerId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to delete this invoice' });
    }

    // Check if invoice can be deleted (only draft invoices can be deleted)
    if (invoice.status !== 'draft') {
      return res.status(400).json({ msg: `Invoice cannot be deleted because it is in ${invoice.status} status` });
    }

    await invoice.remove();
    
    res.json({ msg: 'Invoice removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invoice not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
