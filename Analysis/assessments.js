const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Assessment = require('../models/Assessment');
const auth = require('../../user-service/middleware/auth');

// @route   POST api/assessments
// @desc    Create a new assessment
// @access  Private
router.post('/', [
  auth,
  [
    check('projectId', 'Project ID is required').not().isEmpty(),
    check('imageUrl', 'Image URL is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      projectId,
      imageUrl,
      status,
      assessedBy,
      confidence,
      detections,
      metadata,
      recommendations
    } = req.body;

    // Create new assessment
    const newAssessment = new Assessment({
      projectId,
      imageUrl,
      status: status || 'pending',
      assessedBy: assessedBy || 'ai',
      assessorId: req.user.id,
      confidence,
      detections,
      metadata,
      recommendations
    });

    const assessment = await newAssessment.save();
    
    // In a real implementation, we would trigger the AI assessment process here
    // For example: queue.add('process-assessment', { assessmentId: assessment._id });
    
    res.json(assessment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/assessments
// @desc    Get all assessments for a project
// @access  Private
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const assessments = await Assessment.find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 });
    
    res.json(assessments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/assessments/:id
// @desc    Get assessment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({ msg: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Assessment not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/assessments/:id
// @desc    Update an assessment
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({ msg: 'Assessment not found' });
    }

    // Update fields
    const {
      status,
      confidence,
      detections,
      recommendations,
      reviewHistory
    } = req.body;

    if (status) assessment.status = status;
    if (confidence) assessment.confidence = confidence;
    if (detections) assessment.detections = detections;
    if (recommendations) assessment.recommendations = recommendations;
    
    // Add review history if provided
    if (reviewHistory) {
      if (typeof reviewHistory === 'object' && !Array.isArray(reviewHistory)) {
        // Single review entry
        assessment.reviewHistory.push({
          ...reviewHistory,
          reviewerId: req.user.id,
          timestamp: Date.now()
        });
      } else if (Array.isArray(reviewHistory)) {
        // Replace entire review history
        assessment.reviewHistory = reviewHistory;
      }
    }

    await assessment.save();
    
    res.json(assessment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Assessment not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/assessments/:id
// @desc    Delete an assessment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({ msg: 'Assessment not found' });
    }

    await assessment.remove();
    
    res.json({ msg: 'Assessment removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Assessment not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/assessments/:id/process
// @desc    Trigger AI processing for an assessment
// @access  Private
router.post('/:id/process', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({ msg: 'Assessment not found' });
    }

    // Update status to processing
    assessment.status = 'processing';
    await assessment.save();
    
    // In a real implementation, we would trigger the AI assessment process here
    // For example: queue.add('process-assessment', { assessmentId: assessment._id });
    
    res.json({ msg: 'Assessment processing started', assessment });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Assessment not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
