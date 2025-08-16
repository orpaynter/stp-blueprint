const express = require('express');
const router = express.Router();
const { protect, restrictTo, hasPermission } = require('../../auth/middleware/auth');

// Import assessment controllers
const assessmentController = require('./assessmentController');

// All assessment routes require authentication
router.use(protect);

// GET all assessments (filtered by user role)
router.get('/', assessmentController.getAllAssessments);

// GET assessment by ID
router.get('/:id', assessmentController.getAssessment);

// POST create new assessment
router.post('/', 
  restrictTo('contractor', 'admin'),
  hasPermission('create:assessment'),
  assessmentController.createAssessment
);

// PATCH update assessment
router.patch('/:id', 
  restrictTo('contractor', 'admin'),
  hasPermission('update:assessment'),
  assessmentController.updateAssessment
);

// DELETE assessment
router.delete('/:id', 
  restrictTo('contractor', 'admin'),
  hasPermission('delete:assessment'),
  assessmentController.deleteAssessment
);

// POST upload assessment image
router.post('/:id/images', 
  assessmentController.uploadAssessmentImage
);

// GET assessment images
router.get('/:id/images', assessmentController.getAssessmentImages);

// DELETE assessment image
router.delete('/:id/images/:imageId', 
  restrictTo('contractor', 'admin'),
  assessmentController.deleteAssessmentImage
);

// POST analyze damage
router.post('/:id/analyze-damage', 
  restrictTo('contractor', 'admin', 'insurance_agent'),
  assessmentController.analyzeDamage
);

// GET damage analysis
router.get('/:id/damage-analysis', assessmentController.getDamageAnalysis);

// POST generate cost estimate
router.post('/:id/cost-estimate', 
  restrictTo('contractor', 'admin'),
  assessmentController.generateCostEstimate
);

// GET cost estimate
router.get('/:id/cost-estimate', assessmentController.getCostEstimate);

// POST create claim from assessment
router.post('/:id/create-claim', 
  restrictTo('contractor', 'admin', 'homeowner'),
  assessmentController.createClaimFromAssessment
);

// GET assessment report
router.get('/:id/report', assessmentController.getAssessmentReport);

// POST generate assessment report
router.post('/:id/report', 
  restrictTo('contractor', 'admin', 'insurance_agent'),
  assessmentController.generateAssessmentReport
);

module.exports = router;
