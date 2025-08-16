const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Project = require('../models/Project');
const auth = require('../../user-service/middleware/auth');

// @route   POST api/projects
// @desc    Create a new project
// @access  Private
router.post('/', [
  auth,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('address.street', 'Street address is required').not().isEmpty(),
    check('address.city', 'City is required').not().isEmpty(),
    check('address.state', 'State is required').not().isEmpty(),
    check('address.zipCode', 'Zip code is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      description,
      status,
      progress,
      contractor,
      address,
      propertyType,
      roofType,
      roofArea,
      startDate,
      dueDate,
      budget
    } = req.body;

    // Create new project
    const newProject = new Project({
      title,
      description,
      status,
      progress,
      owner: req.user.id,
      contractor,
      address,
      propertyType,
      roofType,
      roofArea,
      startDate,
      dueDate,
      budget
    });

    const project = await newProject.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/projects
// @desc    Get all projects for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let projects;
    
    // Filter projects based on user role
    switch (req.user.role) {
      case 'homeowner':
        // Homeowners see only their projects
        projects = await Project.find({ owner: req.user.id })
          .sort({ createdAt: -1 });
        break;
      case 'contractor':
        // Contractors see projects assigned to them
        projects = await Project.find({ contractor: req.user.id })
          .sort({ createdAt: -1 });
        break;
      case 'supplier':
        // Suppliers see projects with materials from them
        projects = await Project.find({ 'materials.supplier': req.user.id })
          .sort({ createdAt: -1 });
        break;
      case 'insurance':
        // Insurance agents see all projects (could be filtered by insurance company)
        projects = await Project.find()
          .sort({ createdAt: -1 });
        break;
      default:
        projects = [];
    }
    
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user has access to this project
    const hasAccess = 
      req.user.id === project.owner.toString() || 
      req.user.id === project.contractor?.toString() ||
      project.materials.some(m => m.supplier?.toString() === req.user.id) ||
      req.user.role === 'insurance';
    
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to access this project' });
    }

    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user has permission to update this project
    const canUpdate = 
      req.user.id === project.owner.toString() || 
      req.user.id === project.contractor?.toString();
    
    if (!canUpdate) {
      return res.status(403).json({ msg: 'Not authorized to update this project' });
    }

    // Update fields
    const {
      title,
      description,
      status,
      progress,
      contractor,
      address,
      propertyType,
      roofType,
      roofArea,
      startDate,
      dueDate,
      completionDate,
      budget,
      actualCost,
      materials,
      laborCost,
      notes,
      weather
    } = req.body;

    if (title) project.title = title;
    if (description) project.description = description;
    if (status) project.status = status;
    if (progress !== undefined) project.progress = progress;
    if (contractor) project.contractor = contractor;
    if (address) project.address = address;
    if (propertyType) project.propertyType = propertyType;
    if (roofType) project.roofType = roofType;
    if (roofArea) project.roofArea = roofArea;
    if (startDate) project.startDate = startDate;
    if (dueDate) project.dueDate = dueDate;
    if (completionDate) project.completionDate = completionDate;
    if (budget) project.budget = budget;
    if (actualCost) project.actualCost = actualCost;
    if (materials) project.materials = materials;
    if (laborCost) project.laborCost = laborCost;
    if (notes) {
      // Add new note
      if (typeof notes === 'string') {
        project.notes.push({
          text: notes,
          author: req.user.id
        });
      } else if (Array.isArray(notes)) {
        project.notes = notes;
      }
    }
    if (weather) project.weather = weather;

    await project.save();
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is the owner
    if (req.user.id !== project.owner.toString()) {
      return res.status(403).json({ msg: 'Not authorized to delete this project' });
    }

    await project.remove();
    
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/projects/:id/images
// @desc    Add image to project
// @access  Private
router.post('/:id/images', [
  auth,
  [
    check('url', 'Image URL is required').not().isEmpty(),
    check('caption', 'Caption is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user has permission to update this project
    const canUpdate = 
      req.user.id === project.owner.toString() || 
      req.user.id === project.contractor?.toString();
    
    if (!canUpdate) {
      return res.status(403).json({ msg: 'Not authorized to update this project' });
    }

    const { url, caption } = req.body;

    project.images.push({
      url,
      caption,
      dateAdded: Date.now()
    });

    await project.save();
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
