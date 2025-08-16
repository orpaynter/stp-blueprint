const express = require('express');
const router = express.Router();
const { protect, restrictTo, hasPermission } = require('../../auth/middleware/auth');

// Import marketplace controllers
const marketplaceController = require('./marketplaceController');

// All marketplace routes require authentication
router.use(protect);

// Product routes
// GET all products
router.get('/products', marketplaceController.getAllProducts);

// GET product by ID
router.get('/products/:id', marketplaceController.getProduct);

// POST create new product
router.post('/products', 
  restrictTo('contractor', 'admin', 'supplier'),
  hasPermission('create:product'),
  marketplaceController.createProduct
);

// PATCH update product
router.patch('/products/:id', 
  restrictTo('contractor', 'admin', 'supplier'),
  hasPermission('update:product'),
  marketplaceController.updateProduct
);

// DELETE product
router.delete('/products/:id', 
  restrictTo('contractor', 'admin', 'supplier'),
  hasPermission('delete:product'),
  marketplaceController.deleteProduct
);

// POST upload product image
router.post('/products/:id/images', 
  restrictTo('contractor', 'admin', 'supplier'),
  marketplaceController.uploadProductImage
);

// DELETE product image
router.delete('/products/:id/images/:imageId', 
  restrictTo('contractor', 'admin', 'supplier'),
  marketplaceController.deleteProductImage
);

// Service routes
// GET all services
router.get('/services', marketplaceController.getAllServices);

// GET service by ID
router.get('/services/:id', marketplaceController.getService);

// POST create new service
router.post('/services', 
  restrictTo('contractor', 'admin', 'supplier'),
  hasPermission('create:service'),
  marketplaceController.createService
);

// PATCH update service
router.patch('/services/:id', 
  restrictTo('contractor', 'admin', 'supplier'),
  hasPermission('update:service'),
  marketplaceController.updateService
);

// DELETE service
router.delete('/services/:id', 
  restrictTo('contractor', 'admin', 'supplier'),
  hasPermission('delete:service'),
  marketplaceController.deleteService
);

// Order routes
// GET all orders
router.get('/orders', marketplaceController.getAllOrders);

// GET order by ID
router.get('/orders/:id', marketplaceController.getOrder);

// POST create new order
router.post('/orders', 
  marketplaceController.createOrder
);

// PATCH update order
router.patch('/orders/:id', 
  marketplaceController.updateOrder
);

// DELETE order
router.delete('/orders/:id', 
  restrictTo('admin'),
  marketplaceController.deleteOrder
);

// POST process order
router.post('/orders/:id/process', 
  restrictTo('contractor', 'admin', 'supplier'),
  marketplaceController.processOrder
);

// POST cancel order
router.post('/orders/:id/cancel', 
  marketplaceController.cancelOrder
);

// Review routes
// GET all reviews
router.get('/reviews', marketplaceController.getAllReviews);

// GET review by ID
router.get('/reviews/:id', marketplaceController.getReview);

// POST create new review
router.post('/reviews', 
  marketplaceController.createReview
);

// PATCH update review
router.patch('/reviews/:id', 
  marketplaceController.updateReview
);

// DELETE review
router.delete('/reviews/:id', 
  marketplaceController.deleteReview
);

// Category routes
// GET all categories
router.get('/categories', marketplaceController.getAllCategories);

// GET category by ID
router.get('/categories/:id', marketplaceController.getCategory);

// POST create new category
router.post('/categories', 
  restrictTo('admin'),
  marketplaceController.createCategory
);

// PATCH update category
router.patch('/categories/:id', 
  restrictTo('admin'),
  marketplaceController.updateCategory
);

// DELETE category
router.delete('/categories/:id', 
  restrictTo('admin'),
  marketplaceController.deleteCategory
);

// Search routes
// POST search marketplace
router.post('/search', marketplaceController.searchMarketplace);

// GET recommendations
router.get('/recommendations', marketplaceController.getRecommendations);

module.exports = router;
