const express = require('express');
const router = express.Router();
const { protect, restrictTo, hasPermission } = require('../../auth/middleware/auth');

// Import payment controllers
const paymentController = require('./paymentController');

// All payment routes require authentication
router.use(protect);

// GET all payments (filtered by user role)
router.get('/', paymentController.getAllPayments);

// GET payment by ID
router.get('/:id', paymentController.getPayment);

// POST create new payment
router.post('/', 
  restrictTo('contractor', 'admin', 'insurance_agent'),
  hasPermission('create:payment'),
  paymentController.createPayment
);

// PATCH update payment
router.patch('/:id', 
  restrictTo('contractor', 'admin', 'insurance_agent'),
  hasPermission('update:payment'),
  paymentController.updatePayment
);

// DELETE payment
router.delete('/:id', 
  restrictTo('admin', 'insurance_agent'),
  hasPermission('delete:payment'),
  paymentController.deletePayment
);

// POST process payment
router.post('/:id/process', 
  restrictTo('contractor', 'admin', 'insurance_agent'),
  paymentController.processPayment
);

// POST create invoice
router.post('/invoices', 
  restrictTo('contractor', 'admin'),
  hasPermission('create:invoice'),
  paymentController.createInvoice
);

// GET all invoices
router.get('/invoices', paymentController.getAllInvoices);

// GET invoice by ID
router.get('/invoices/:id', paymentController.getInvoice);

// PATCH update invoice
router.patch('/invoices/:id', 
  restrictTo('contractor', 'admin'),
  hasPermission('update:invoice'),
  paymentController.updateInvoice
);

// DELETE invoice
router.delete('/invoices/:id', 
  restrictTo('contractor', 'admin'),
  hasPermission('delete:invoice'),
  paymentController.deleteInvoice
);

// POST send invoice
router.post('/invoices/:id/send', 
  restrictTo('contractor', 'admin'),
  paymentController.sendInvoice
);

// POST mark invoice as paid
router.post('/invoices/:id/mark-paid', 
  restrictTo('contractor', 'admin', 'homeowner'),
  paymentController.markInvoiceAsPaid
);

// GET payment methods
router.get('/methods', paymentController.getPaymentMethods);

// POST add payment method
router.post('/methods', paymentController.addPaymentMethod);

// DELETE payment method
router.delete('/methods/:id', paymentController.deletePaymentMethod);

// GET payment statistics
router.get('/statistics', 
  restrictTo('contractor', 'admin'),
  paymentController.getPaymentStatistics
);

module.exports = router;
