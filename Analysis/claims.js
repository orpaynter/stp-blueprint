const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Claim = require('../models/Claim');
const auth = require('../../user-service/middleware/auth');

// @route   POST api/claims
// @desc    Create a new claim
// @access  Private
router.post('/', [
  auth,
  [
    check('projectId', 'Project ID is required').not().isEmpty(),
    check('assessmentId', 'Assessment ID is required').not().isEmpty(),
    check('damageType', 'Damage type is required').isIn(['hail', 'wind', 'water', 'fire', 'other']),
    check('damageDate', 'Damage date is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      projectId,
      assessmentId,
      insuranceCompany,
      damageType,
      damageDate,
      description,
      estimatedDamage,
      documents
    } = req.body;

    // Create new claim
    const newClaim = new Claim({
      projectId,
      assessmentId,
      homeownerId: req.user.id,
      insuranceCompany,
      damageType,
      damageDate,
      description,
      estimatedDamage,
      documents
    });

    const claim = await newClaim.save();
    
    res.json(claim);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/claims
// @desc    Get all claims for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let claims;
    
    // Filter claims based on user role
    switch (req.user.role) {
      case 'homeowner':
        // Homeowners see only their claims
        claims = await Claim.find({ homeownerId: req.user.id })
          .sort({ createdAt: -1 });
        break;
      case 'insurance':
        // Insurance agents see claims assigned to them or their company
        claims = await Claim.find({ 
          $or: [
            { insuranceAgentId: req.user.id },
            { 'insuranceCompany.name': req.user.company }
          ]
        }).sort({ createdAt: -1 });
        break;
      case 'contractor':
        // Contractors see claims for their projects
        // This would require a more complex query joining with projects
        // For simplicity, we'll just return an empty array
        claims = [];
        break;
      default:
        claims = [];
    }
    
    res.json(claims);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/claims/project/:projectId
// @desc    Get all claims for a project
// @access  Private
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const claims = await Claim.find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 });
    
    res.json(claims);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/claims/:id
// @desc    Get claim by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({ msg: 'Claim not found' });
    }

    // Check if user has access to this claim
    const hasAccess = 
      req.user.id === claim.homeownerId.toString() || 
      req.user.id === claim.insuranceAgentId?.toString() ||
      req.user.role === 'insurance';
    
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to access this claim' });
    }

    res.json(claim);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Claim not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/claims/:id
// @desc    Update a claim
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let claim = await Claim.findById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({ msg: 'Claim not found' });
    }

    // Check if user has permission to update this claim
    const canUpdate = 
      req.user.id === claim.homeownerId.toString() || 
      req.user.id === claim.insuranceAgentId?.toString() ||
      req.user.role === 'insurance';
    
    if (!canUpdate) {
      return res.status(403).json({ msg: 'Not authorized to update this claim' });
    }

    // Update fields
    const {
      status,
      insuranceAgentId,
      insuranceCompany,
      description,
      estimatedDamage,
      approvedAmount,
      deductible,
      documents,
      notes,
      fraudDetectionResult
    } = req.body;

    // If status is changing, add to timeline
    if (status && status !== claim.status) {
      claim.timeline.push({
        status,
        date: new Date(),
        updatedBy: req.user.id,
        notes: req.body.statusNote || `Status changed from ${claim.status} to ${status}`
      });
      claim.status = status;
    }

    if (insuranceAgentId) claim.insuranceAgentId = insuranceAgentId;
    if (insuranceCompany) claim.insuranceCompany = insuranceCompany;
    if (description) claim.description = description;
    if (estimatedDamage) claim.estimatedDamage = estimatedDamage;
    if (approvedAmount) claim.approvedAmount = approvedAmount;
    if (deductible) claim.deductible = deductible;
    if (documents) {
      // Add new documents
      if (Array.isArray(documents)) {
        documents.forEach(doc => {
          if (!doc.uploadedBy) {
            doc.uploadedBy = req.user.id;
          }
          if (!doc.uploadDate) {
            doc.uploadDate = new Date();
          }
        });
        claim.documents = [...claim.documents, ...documents];
      }
    }
    if (notes) {
      // Add new note
      if (typeof notes === 'string') {
        claim.notes.push({
          text: notes,
          author: req.user.id,
          date: new Date(),
          isInternal: req.user.role === 'insurance'
        });
      } else if (Array.isArray(notes)) {
        notes.forEach(note => {
          if (!note.author) {
            note.author = req.user.id;
          }
          if (!note.date) {
            note.date = new Date();
          }
        });
        claim.notes = [...claim.notes, ...notes];
      }
    }
    if (fraudDetectionResult) claim.fraudDetectionResult = fraudDetectionResult;

    await claim.save();
    
    res.json(claim);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Claim not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/claims/:id/submit
// @desc    Submit a claim
// @access  Private
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({ msg: 'Claim not found' });
    }

    // Check if user is the homeowner
    if (req.user.id !== claim.homeownerId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to submit this claim' });
    }

    // Check if claim is in draft status
    if (claim.status !== 'draft') {
      return res.status(400).json({ msg: `Claim cannot be submitted because it is in ${claim.status} status` });
    }

    // Update status to submitted
    claim.status = 'submitted';
    claim.timeline.push({
      status: 'submitted',
      date: new Date(),
      updatedBy: req.user.id,
      notes: 'Claim submitted by homeowner'
    });

    await claim.save();
    
    res.json(claim);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Claim not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/claims/:id/fraud-check
// @desc    Run fraud detection on a claim
// @access  Private (Insurance only)
router.post('/:id/fraud-check', auth, async (req, res) => {
  try {
    // Check if user is insurance agent
    if (req.user.role !== 'insurance') {
      return res.status(403).json({ msg: 'Not authorized to perform fraud check' });
    }

    const claim = await Claim.findById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({ msg: 'Claim not found' });
    }

    // In a real implementation, we would trigger the fraud detection process here
    // For example: queue.add('fraud-detection', { claimId: claim._id });
    
    // For now, just update the claim with a mock result
    claim.fraudDetectionResult = {
      score: Math.floor(Math.random() * 100),
      flags: [],
      lastChecked: new Date()
    };

    await claim.save();
    
    res.json({ msg: 'Fraud detection initiated', claim });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Claim not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
