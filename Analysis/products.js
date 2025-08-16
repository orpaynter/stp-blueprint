const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Product = require('../models/Product');
const auth = require('../../user-service/middleware/auth');

// @route   POST api/products
// @desc    Create a new product
// @access  Private (Supplier only)
router.post('/', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('category', 'Category is required').isIn(['roofing_materials', 'tools', 'safety_equipment', 'accessories', 'other']),
    check('price.amount', 'Price is required').isNumeric()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if user is a supplier
  if (req.user.role !== 'supplier') {
    return res.status(403).json({ msg: 'Only suppliers can create products' });
  }

  try {
    const {
      name,
      description,
      category,
      subcategory,
      price,
      discountPrice,
      unit,
      inventory,
      specifications,
      images,
      shipping,
      status,
      featured,
      tags
    } = req.body;

    // Create new product
    const newProduct = new Product({
      name,
      description,
      category,
      subcategory,
      sellerId: req.user.id,
      price,
      discountPrice,
      unit,
      inventory,
      specifications,
      images,
      shipping,
      status: status || 'active',
      featured: featured || false,
      tags
    });

    const product = await newProduct.save();
    
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      subcategory, 
      sellerId, 
      minPrice, 
      maxPrice, 
      status,
      featured,
      search,
      sort,
      limit = 20,
      page = 1
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (sellerId) filter.sellerId = sellerId;
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
    
    // Only show active products by default
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
    
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));
    
    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    
    res.json({
      products,
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

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private (Supplier only)
router.put('/:id', auth, async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Check if user is the seller
    if (req.user.id !== product.sellerId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to update this product' });
    }

    const {
      name,
      description,
      category,
      subcategory,
      price,
      discountPrice,
      unit,
      inventory,
      specifications,
      images,
      shipping,
      status,
      featured,
      tags
    } = req.body;

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (price) product.price = price;
    if (discountPrice) product.discountPrice = discountPrice;
    if (unit) product.unit = unit;
    if (inventory) product.inventory = inventory;
    if (specifications) product.specifications = specifications;
    if (images) product.images = images;
    if (shipping) product.shipping = shipping;
    if (status) product.status = status;
    if (featured !== undefined) product.featured = featured;
    if (tags) product.tags = tags;

    await product.save();
    
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private (Supplier only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Check if user is the seller
    if (req.user.id !== product.sellerId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to delete this product' });
    }

    await product.remove();
    
    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/products/:id/reviews
// @desc    Add a review to a product
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
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    const { rating, comment } = req.body;

    // Check if user already reviewed this product
    const alreadyReviewed = product.reviews.find(
      review => review.userId.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({ msg: 'Product already reviewed' });
    }

    // Add review
    const review = {
      userId: req.user.id,
      rating: Number(rating),
      comment,
      date: Date.now()
    };

    product.reviews.push(review);

    // Update product rating
    product.rating.count = product.reviews.length;
    product.rating.average = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
