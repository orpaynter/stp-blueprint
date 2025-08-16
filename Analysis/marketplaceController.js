const mongoose = require('mongoose');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Product = require('./models/Product');
const Service = require('./models/Service');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Category = require('./models/Category');
const User = require('../../auth/models/User');
const Project = require('../projects/projectModel');
const { uploadToS3, deleteFromS3 } = require('../../utils/s3Utils');

/**
 * Get all products (with filtering)
 * @route GET /api/marketplace/products
 * @access Private
 */
exports.getAllProducts = catchAsync(async (req, res, next) => {
  // Apply filters from query params
  const queryParams = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete queryParams[field]);
  
  // Advanced filtering
  let queryStr = JSON.stringify(queryParams);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|eq|ne)\b/g, match => `$${match}`);
  
  // Build query
  let query = Product.find(JSON.parse(queryStr));
  
  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  query = query.skip(skip).limit(limit);
  
  // Execute query with population
  const products = await query
    .populate('categoryId', 'name description')
    .populate('supplierId', 'firstName lastName company');
  
  // Get total count for pagination
  const totalCount = await Product.countDocuments(JSON.parse(queryStr));
  
  res.status(200).json({
    status: 'success',
    results: products.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    data: {
      products
    }
  });
});

/**
 * Get product by ID
 * @route GET /api/marketplace/products/:id
 * @access Private
 */
exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('categoryId', 'name description')
    .populate('supplierId', 'firstName lastName email phone company')
    .populate('reviews', 'rating comment userId createdAt');
  
  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      product
    }
  });
});

/**
 * Create new product
 * @route POST /api/marketplace/products
 * @access Private (Contractors, Admins, Suppliers)
 */
exports.createProduct = catchAsync(async (req, res, next) => {
  // Extract product data from request body
  const {
    name,
    description,
    price,
    currency,
    categoryId,
    specifications,
    inventory,
    manufacturer,
    warranty,
    dimensions,
    weight,
    tags
  } = req.body;
  
  // Validate required fields
  if (!name || !price) {
    return next(new AppError('Name and price are required', 400));
  }
  
  // Validate category if provided
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      return next(new AppError('Invalid category ID', 400));
    }
  }
  
  // Create new product
  const newProduct = await Product.create({
    name,
    description,
    price,
    currency: currency || 'USD',
    categoryId,
    specifications,
    inventory: inventory || {
      quantity: 0,
      available: true,
      backorder: false
    },
    manufacturer,
    warranty,
    dimensions,
    weight,
    tags: tags || [],
    supplierId: req.user.id,
    status: 'active',
    createdBy: req.user.id,
    createdAt: Date.now()
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      product: newProduct
    }
  });
});

/**
 * Update product
 * @route PATCH /api/marketplace/products/:id
 * @access Private (Contractors, Admins, Suppliers)
 */
exports.updateProduct = catchAsync(async (req, res, next) => {
  // Find product
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }
  
  // Check if user has permission to update this product
  if (
    req.user.role !== 'admin' &&
    product.supplierId.toString() !== req.user.id
  ) {
    return next(new AppError('You do not have permission to update this product', 403));
  }
  
  // Extract fields to update
  const {
    name,
    description,
    price,
    currency,
    categoryId,
    specifications,
    inventory,
    manufacturer,
    warranty,
    dimensions,
    weight,
    tags,
    status
  } = req.body;
  
  // Validate category if provided
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      return next(new AppError('Invalid category ID', 400));
    }
  }
  
  // Update product
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      price,
      currency,
      categoryId,
      specifications,
      inventory,
      manufacturer,
      warranty,
      dimensions,
      weight,
      tags,
      status,
      updatedBy: req.user.id,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      product: updatedProduct
    }
  });
});

/**
 * Delete product
 * @route DELETE /api/marketplace/products/:id
 * @access Private (Contractors, Admins, Suppliers)
 */
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }
  
  // Check if user has permission to delete this product
  if (
    req.user.role !== 'admin' &&
    product.supplierId.toString() !== req.user.id
  ) {
    return next(new AppError('You do not have permission to delete this product', 403));
  }
  
  // Instead of hard delete, mark as inactive
  product.status = 'inactive';
  product.updatedBy = req.user.id;
  product.updatedAt = Date.now();
  await product.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Product successfully deactivated'
  });
});

/**
 * Upload product image
 * @route POST /api/marketplace/products/:id/images
 * @access Private (Contractors, Admins, Suppliers)
 */
exports.uploadProductImage = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.image) {
    return next(new AppError('Please upload an image', 400));
  }
  
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }
  
  // Check if user has permission to update this product
  if (
    req.user.role !== 'admin' &&
    product.supplierId.toString() !== req.user.id
  ) {
    return next(new AppError('You do not have permission to update this product', 403));
  }
  
  const file = req.files.image;
  const { description, isPrimary } = req.body;
  
  // Validate file is an image
  if (!file.mimetype.startsWith('image')) {
    return next(new AppError('Please upload an image file', 400));
  }
  
  // Upload file to S3
  const uploadResult = await uploadToS3(file, `marketplace/products/${product._id}/images`);
  
  // If this is the primary image, update all other images to not be primary
  if (isPrimary === 'true' || isPrimary === true) {
    product.images.forEach(image => {
      image.isPrimary = false;
    });
  }
  
  // Add image to product
  product.images.push({
    url: uploadResult.Location,
    key: uploadResult.Key,
    description,
    isPrimary: isPrimary === 'true' || isPrimary === true || (product.images.length === 0),
    uploadedBy: req.user.id,
    uploadedAt: Date.now()
  });
  
  await product.save();
  
  res.status(201).json({
    status: 'success',
    data: {
      image: product.images[product.images.length - 1]
    }
  });
});

/**
 * Delete product image
 * @route DELETE /api/marketplace/products/:id/images/:imageId
 * @access Private (Contractors, Admins, Suppliers)
 */
exports.deleteProductImage = catchAsync(async (req, res, next) => {
  const { imageId } = req.params;
  
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }
  
  // Check if user has permission to update this product
  if (
    req.user.role !== 'admin' &&
    product.supplierId.toString() !== req.user.id
  ) {
    return next(new AppError('You do not have permission to update this product', 403));
  }
  
  // Find image
  const image = product.images.id(imageId);
  
  if (!image) {
    return next(new AppError('No image found with that ID', 404));
  }
  
  // Delete file from S3
  await deleteFromS3(image.key);
  
  // Remove image from product
  image.remove();
  
  // If the deleted image was primary and there are other images, make the first one primary
  if (image.isPrimary && product.images.length > 0) {
    product.images[0].isPrimary = true;
  }
  
  await product.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Image successfully deleted'
  });
});

/**
 * Get all services
 * @route GET /api/marketplace/services
 * @access Private
 */
exports.getAllServices = catchAsync(async (req, res, next) => {
  // Apply filters from query params
  const queryParams = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete queryParams[field]);
  
  // Advanced filtering
  let queryStr = JSON.stringify(queryParams);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|eq|ne)\b/g, match => `$${match}`);
  
  // Build query
  let query = Service.find(JSON.parse(queryStr));
  
  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  query = query.skip(skip).limit(limit);
  
  // Execute query with population
  const services = await query
    .populate('categoryId', 'name description')
    .populate('providerId', 'firstName lastName company');
  
  // Get total count for pagination
  const totalCount = await Service.countDocuments(JSON.parse(queryStr));
  
  res.status(200).json({
    status: 'success',
    results: services.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    data: {
      services
    }
  });
});

/**
 * Get service by ID
 * @route GET /api/marketplace/services/:id
 * @access Private
 */
exports.getService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id)
    .populate('categoryId', 'name description')
    .populate('providerId', 'firstName lastName email phone company')
    .populate('reviews', 'rating comment userId createdAt');
  
  if (!service) {
    return next(new AppError('No service found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      service
    }
  });
});

/**
 * Create new service
 * @route POST /api/marketplace/services
 * @access Private (Contractors, Admins, Suppliers)
 */
exports.createService = catchAsync(async (req, res, next) => {
  // Extract service data from request body
  const {
    name,
    description,
    price,
    currency,
    categoryId,
    duration,
    availability,
    tags
  } = req.body;
  
  // Validate required fields
  if (!name || !price) {
    return next(new AppError('Name and price are required', 400));
  }
  
  // Validate category if provided
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      return next(new AppError('Invalid category ID', 400));
    }
  }
  
  // Create new service
  const newService = await Service.create({
    name,
    description,
    price,
    currency: currency || 'USD',
    categoryId,
    duration,
    availability,
    tags: tags || [],
    providerId: req.user.id,
    status: 'active',
    createdBy: req.user.id,
    createdAt: Date.now()
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      service: newService
    }
  });
});

/**
 * Update service
 * @route PATCH /api/marketplace/services/:id
 * @access Private (Contractors, Admins, Suppliers)
 */
exports.updateService = catchAsync(async (req, res, next) => {
  // Find service
  const service = await Service.findById(req.params.id);
  
  if (!service) {
    return next(new AppError('No service found with that ID', 404));
  }
  
  // Check if user has permission to update this service
  if (
    req.user.role !== 'admin' &&
    service.providerId.toString() !== req.user.id
  ) {
    return next(new AppError('You do not have permission to update this service', 403));
  }
  
  // Extract fields to update
  const {
    name,
    description,
    price,
    currency,
    categoryId,
    duration,
    availability,
    tags,
    status
  } = req.body;
  
  // Validate category if provided
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      return next(new AppError('Invalid category ID', 400));
    }
  }
  
  // Update service
  const updatedService = await Service.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      price,
      currency,
      categoryId,
      duration,
      availability,
      tags,
      status,
      updatedBy: req.user.id,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      service: updatedService
    }
  });
});

/**
 * Delete service
 * @route DELETE /api/marketplace/services/:id
 * @access Private (Contractors, Admins, Suppliers)
 */
exports.deleteService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id);
  
  if (!service) {
    return next(new AppError('No service found with that ID', 404));
  }
  
  // Check if user has permission to delete this service
  if (
    req.user.role !== 'admin' &&
    service.providerId.toString() !== req.user.id
  ) {
    return next(new AppError('You do not have permission to delete this service', 403));
  }
  
  // Instead of hard delete, mark as inactive
  service.status = 'inactive';
  service.updatedBy = req.user.id;
  service.updatedAt = Date.now();
  await service.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Service successfully deactivated'
  });
});

/**
 * Get all orders
 * @route GET /api/marketplace/orders
 * @access Private
 */
exports.getAllOrders = catchAsync(async (req, res, next) => {
  let filter = {};
  
  // Filter orders based on user role
  if (req.user.role === 'homeowner' || req.user.role === 'contractor') {
    // Users can only see their own orders
    filter.customerId = req.user.id;
  } else if (req.user.role === 'supplier') {
    // Suppliers can see orders for their products/services
    filter.sellerId = req.user.id;
  }
  // Admins can see all orders (no filter)
  
  // Apply additional filters from query params
  const queryParams = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete
(Content truncated due to size limit. Use line ranges to read in chunks)