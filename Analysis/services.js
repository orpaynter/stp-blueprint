const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Service = require('../models/Service');
const auth = require('../../user-service/middleware/auth');

// @route   POST api/services
// @desc    Create a new service
// @access  Private (Contractor only)
router.post('/', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('category', 'Category is required').isIn(['roof_installation', 'roof_repair', 'inspection', 'maintenance', 'consultation', 'other']),
    check('price.amount', 'Price is required').isNumeric(),
    check('duration.estimated', 'Estimated duration is required').isNumeric()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if user is a contractor
  if (req.user.role !== 'contractor') {
    return res.status(403).json({ msg: 'Only contractors can create services' });
  }

  try {
    const {
      name,
      description,
      category,
      price,
      discountPrice,
      duration,
      availability,
      serviceArea,
      images,
      requirements,
      inclusions,
      exclusions,
      status,
      featured,
      tags
    } = req.body;

    // Create new service
    const newService = new Service({
      name,
      description,
      category,
      providerId: req.user.id,
      price,
      discountPrice,
      duration,
      availability,
      serviceArea,
      images,
      requirements,
      inclusions,
      exclusions,
      status: status || 'active',
      featured: featured || false,
      tags
    });

    const service = await newService.save();
    
    res.json(service);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/services
// @desc    Get all services
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      providerId, 
      minPrice, 
      maxPrice, 
      status,
      featured,
      search,
      location,
      sort,
      limit = 20,
      page = 1
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (providerId) filter.providerId = providerId;
    if (status) filter.status = status;
    if (featured) filter.featured = featured === 'true';
    
    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.amount = { $gte: Number(minPrice) };
      if (maxPrice) filter.price.amount = { ...filter.price.amount, $lte: Number(maxPrice) };
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Location search (zip code)
    if (location) {
      filter['serviceArea.zipCodes'] = location;
    }
    
    // Only show active services by default
    if (!status) {
      filter.status = 'active';
    }
    
    // Build sort object
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case 'price_asc':
          sortOption = { 'price.amount': 1 };
          break;
        case 'price_desc':
          sortOption = { 'price.amount': -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        case 'rating':
          sortOption = { 'rating.average': -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    } else {
      // Default sort by newest
      sortOption = { createdAt: -1 };
    }
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const services = await Service.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));
    
    // Get total count for pagination
    const total = await Service.countDocuments(filter);
    
    res.json({
      services,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/services/:id
// @desc    Get service by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    res.json(service);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Service not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/services/:id
// @desc    Update a service
// @access  Private (Contractor only)
router.put('/:id', auth, async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    // Check if user is the provider
    if (req.user.id !== service.providerId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to update this service' });
    }

    const {
      name,
      description,
      category,
      price,
      discountPrice,
      duration,
      availability,
      serviceArea,
      images,
      requirements,
      inclusions,
      exclusions,
      status,
      featured,
      tags
    } = req.body;

    // Update fields
    if (name) service.name = name;
    if (description) service.description = description;
    if (category) service.category = category;
    if (price) service.price = price;
    if (discountPrice) service.discountPrice = discountPrice;
    if (duration) service.duration = duration;
    if (availability) service.availability = availability;
    if (serviceArea) service.serviceArea = serviceArea;
    if (images) service.images = images;
    if (requirements) service.requirements = requirements;
    if (inclusions) service.inclusions = inclusions;
    if (exclusions) service.exclusions = exclusions;
    if (status) service.status = status;
    if (featured !== undefined) service.featured = featured;
    if (tags) service.tags = tags;

    await service.save();
    
    res.json(service);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Service not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/services/:id
// @desc    Delete a service
// @access  Private (Contractor only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    // Check if user is the provider
    if (req.user.id !== service.providerId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to delete this service' });
    }

    await service.remove();
    
    res.json({ msg: 'Service removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Service not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/services/:id/reviews
// @desc    Add a review to a service
// @access  Private
router.post('/:id/reviews', [
  auth,
  [
    check('rating', 'Rating is required').isInt({ min: 1, max: 5 }),
    check('comment', 'Comment is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    const { rating, comment } = req.body;

    // Check if user already reviewed this service
    const alreadyReviewed = service.reviews.find(
      review => review.userId.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({ msg: 'Service already reviewed' });
    }

    // Add review
    const review = {
      userId: req.user.id,
      rating: Number(rating),
      comment,
      date: Date.now()
    };

    service.reviews.push(review);

    // Update service rating
    service.rating.count = service.reviews.length;
    service.rating.average = service.reviews.reduce((acc, item) => item.rating + acc, 0) / service.reviews.length;

    await service.save();
    
    res.json(service);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Service not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
