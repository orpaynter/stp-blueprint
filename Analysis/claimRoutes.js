const express = require('express');
const router = express.Router();
const { protect, restrictTo, hasPermission } = require('../../auth/middleware/auth');

// Import claim controllers
const claimController = require('./claimController');

// All claim routes require authentication
router.use(protect);

// GET all claims (filtered by user role)
router.get('/', claimController.getAllClaims);

// GET claim by ID
router.get('/:id', claimController.getClaim);

// POST create new claim
router.post('/', 
  restrictTo('contractor', 'admin', 'homeowner', 'insurance_agent'),
  hasPermission('create:claim'),
  claimController.createClaim
);

// PATCH update claim
router.patch('/:id', 
  restrictTo('contractor', 'admin', 'insurance_agent'),
  hasPermission('update:claim'),
  claimController.updateClaim
);

// DELETE claim
router.delete('/:id', 
  restrictTo('contractor', 'admin', 'insurance_agent'),
  hasPermission('delete:claim'),
  claimController.deleteClaim
);

// POST upload claim document
router.post('/:id/documents', 
  claimController.uploadClaimDocument
);

// GET claim documents
router.get('/:id/documents', claimController.getClaimDocuments);

// DELETE claim document
router.delete('/:id/documents/:documentId', 
  restrictTo('contractor', 'admin', 'insurance_agent', 'homeowner'),
  claimController.deleteClaimDocument
);

// POST verify claim
router.post('/:id/verify', 
  restrictTo('insurance_agent', 'admin'),
  claimController.verifyClaim
);

// POST approve claim
router.post('/:id/approve', 
  restrictTo('insurance_agent', 'admin'),
  claimController.approveClaim
);

// POST reject claim
router.post('/:id/reject', 
  restrictTo('insurance_agent', 'admin'),
  claimController.rejectClaim
);

// POST detect fraud
router.post('/:id/detect-fraud', 
  restrictTo('insurance_agent', 'admin'),
  claimController.detectFraud
);

// GET fraud analysis
router.get('/:id/fraud-analysis', 
  restrictTo('insurance_agent', 'admin'),
  claimController.getFraudAnalysis
);

// POST create payment from claim
router.post('/:id/create-payment', 
  restrictTo('insurance_agent', 'admin'),
  claimController.createPaymentFromClaim
);

// GET claim status history
router.get('/:id/status-history', claimController.getClaimStatusHistory);

// GET claim report
router.get('/:id/report', claimController.getClaimReport);

// POST generate claim report
router.post('/:id/report', 
  restrictTo('contractor', 'admin', 'insurance_agent'),
  claimController.generateClaimReport
);

module.exports = router;
