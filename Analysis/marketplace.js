const express = require('express');
const passport = require('passport');
const router = express.Router();

// Middleware to check role authorization
const checkRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (roles.includes(req.user.role)) {
    return next();
  }
  
  return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
};

/**
 * @swagger
 * /api/v1/marketplace/products:
 *   get:
 *     summary: Get all marketplace products
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter products by category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of products to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of products to skip
 *     responses:
 *       200:
 *         description: List of products
 *       401:
 *         description: Unauthorized
 */
router.get('/products', passport.authenticate('jwt', { session: false }), (req, res) => {
  // In a real application, you would fetch products from your database
  // For this example, we'll return mock data
  const products = [
    {
      id: 'prod1',
      name: 'Premium Asphalt Shingles',
      description: 'High-quality architectural shingles with 30-year warranty',
      category: 'roofing_materials',
      price: 75.99,
      currency: 'USD',
      unit: 'bundle',
      in_stock: true,
      supplier_id: 'sup1',
      created_at: '2025-01-15T10:00:00Z'
    },
    {
      id: 'prod2',
      name: 'Metal Roofing Panels',
      description: 'Durable metal roofing panels with 50-year warranty',
      category: 'roofing_materials',
      price: 120.50,
      currency: 'USD',
      unit: 'panel',
      in_stock: true,
      supplier_id: 'sup2',
      created_at: '2025-02-10T14:30:00Z'
    }
  ];
  
  return res.json({ products });
});

/**
 * @swagger
 * /api/v1/marketplace/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.get('/products/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  // In a real application, you would fetch the product from your database
  // For this example, we'll return mock data
  const product = {
    id: req.params.id,
    name: 'Premium Asphalt Shingles',
    description: 'High-quality architectural shingles with 30-year warranty',
    category: 'roofing_materials',
    price: 75.99,
    currency: 'USD',
    unit: 'bundle',
    in_stock: true,
    inventory_count: 250,
    supplier: {
      id: 'sup1',
      name: 'ABC Roofing Supplies',
      contact_email: 'sales@abcroofingsupplies.com',
      contact_phone: '555-123-4567'
    },
    specifications: {
      material: 'Asphalt',
      color: 'Charcoal Gray',
      dimensions: '13.25" x 39.375"',
      coverage_per_bundle: 33.3,
      bundles_per_square: 3,
      weight_per_bundle: 80
    },
    features: [
      'Class A fire rating',
      'Wind resistance up to 130 mph',
      'Algae resistant',
      'Energy Star certified'
    ],
    warranty: '30-year limited manufacturer warranty',
    images: [
      {
        id: 'img1',
        url: 'https://storage.orpaynter.com/marketplace/prod1/image1.jpg',
        type: 'primary'
      },
      {
        id: 'img2',
        url: 'https://storage.orpaynter.com/marketplace/prod1/image2.jpg',
        type: 'detail'
      }
    ],
    reviews: [
      {
        id: 'rev1',
        user_id: 'user1',
        user_name: 'Mike Johnson',
        rating: 5,
        comment: 'Excellent quality shingles, easy to install',
        created_at: '2025-02-20T09:15:00Z'
      }
    ],
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-03-01T11:30:00Z'
  };
  
  return res.json({ product });
});

/**
 * @swagger
 * /api/v1/marketplace/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - category
 *               - price
 *               - unit
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               unit:
 *                 type: string
 *               in_stock:
 *                 type: boolean
 *                 default: true
 *               inventory_count:
 *                 type: integer
 *               specifications:
 *                 type: object
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               warranty:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/products', passport.authenticate('jwt', { session: false }), checkRole(['supplier']), (req, res) => {
  // In a real application, you would validate and store the product in your database
  // For this example, we'll just return a success response
  const { name, description, category, price, currency, unit, in_stock, inventory_count, specifications, features, warranty } = req.body;
  
  // Validate required fields
  if (!name || !description || !category || !price || !unit) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  return res.status(201).json({
    message: 'Product created successfully',
    product: {
      id: 'prod3',
      name,
      description,
      category,
      price,
      currency: currency || 'USD',
      unit,
      in_stock: in_stock !== undefined ? in_stock : true,
      inventory_count,
      specifications,
      features,
      warranty,
      supplier_id: req.user.id,
      created_at: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/v1/marketplace/services:
 *   get:
 *     summary: Get all marketplace services
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter services by category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of services to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of services to skip
 *     responses:
 *       200:
 *         description: List of services
 *       401:
 *         description: Unauthorized
 */
router.get('/services', passport.authenticate('jwt', { session: false }), (req, res) => {
  // In a real application, you would fetch services from your database
  // For this example, we'll return mock data
  const services = [
    {
      id: 'serv1',
      name: 'Roof Inspection',
      description: 'Comprehensive roof inspection with detailed report',
      category: 'inspection',
      price: 250,
      currency: 'USD',
      duration: 120,
      provider_id: 'prov1',
      created_at: '2025-01-20T11:00:00Z'
    },
    {
      id: 'serv2',
      name: 'Gutter Cleaning',
      description: 'Complete gutter cleaning and minor repairs',
      category: 'maintenance',
      price: 150,
      currency: 'USD',
      duration: 90,
      provider_id: 'prov2',
      created_at: '2025-02-15T13:45:00Z'
    }
  ];
  
  return res.json({ services });
});

/**
 * @swagger
 * /api/v1/marketplace/services/{id}:
 *   get:
 *     summary: Get a service by ID
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 */
router.get('/services/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  // In a real application, you would fetch the service from your database
  // For this example, we'll return mock data
  const service = {
    id: req.params.id,
    name: 'Roof Inspection',
    description: 'Comprehensive roof inspection with detailed report',
    category: 'inspection',
    price: 250,
    currency: 'USD',
    duration: 120,
    provider: {
      id: 'prov1',
      name: 'Expert Roof Inspections LLC',
      contact_email: 'info@expertroofing.com',
      contact_phone: '555-987-6543',
      rating: 4.8
    },
    details: {
      includes: [
        'Visual inspection of all roof surfaces',
        'Attic inspection for leaks and ventilation',
        'Gutter and downspout assessment',
        'Flashing and chimney inspection',
        'Detailed written report with photos',
        'Repair recommendations if needed'
      ],
      excludes: [
        'Repairs or maintenance',
        'Drone photography (available as add-on)'
      ]
    },
    availability: {
      lead_time_days: 3,
      service_area: ['Anytown', 'Nearbyville', 'Otherburg'],
      hours: 'Monday-Friday, 8am-5pm'
    },
    reviews: [
      {
        id: 'rev1',
        user_id: 'user1',
        user_name: 'Jane Smith',
        rating: 5,
        comment: 'Very thorough inspection, detailed report delivered same day',
        created_at: '2025-02-25T16:20:00Z'
      }
    ],
    created_at: '2025-01-20T11:00:00Z',
    updated_at: '2025-03-05T10:15:00Z'
  };
  
  return res.json({ service });
});

/**
 * @swagger
 * /api/v1/marketplace/services:
 *   post:
 *     summary: Create a new service
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - category
 *               - price
 *               - duration
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               details:
 *                 type: object
 *                 properties:
 *                   includes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   excludes:
 *                     type: array
 *                     items:
 *                       type: string
 *               availability:
 *                 type: object
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/services', passport.authenticate('jwt', { session: false }), checkRole(['contractor']), (req, res) => {
  // In a real application, you would validate and store the service in your database
  // For this example, we'll just return a success response
  const { name, description, category, price, currency, duration, details, availability } = req.body;
  
  // Validate required fields
  if (!name || !description || !category || !price || !duration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  return res.status(201).json({
    message: 'Service created successfully',
    service: {
      id: 'serv3',
      name,
      description,
      category,
      price,
      currency: currency || 'USD',
      duration,
      details,
      availability,
      provider_id: req.user.id,
      created_at: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/v1/marketplace/orders:
 *   get:
 *     summary: Get all marketplace orders
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter orders by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of orders to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of orders to skip
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Unauthorized
 */
router.get('/orders', passport.authenticate('jwt', { session: false }), (req, res) => {
  // In a real application, you would fetch orders from your database
  // For this example, we'll return mock data
  const orders = [
    {
      id: 'ord1',
      project_id: '1',
      customer_id: 'cust1',
      status: 'delivered',
      total_amount: 1500,
      currency: 'USD',
      created_at: '2025-03-10T09:30:00Z',
      updated_at: '2025-03-15T14:20:00Z'
    },
    {
      id: 'ord2',
      project_id: '2',
      customer_id: 'cust2',
      status: 'processing',
      total_amount: 2200,
      currency: 'USD',
      created_at: '2025-04-05T11:15:00Z',
      updated_at: '2025-04-06T10:30:00Z'
    }
  ];
  
  return res.json({ orders });
});

/**
 * @swagger
 * /api/v1/marketplace/orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get('/orders/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  // In a real application, you would fetch the order from your database
  // For this example, we'll return mock data
  const order = {
    id: req.params.id,
    project_id: '1',
    customer: {
      id: 'cust1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-123-4567'
    },
    shipping_address: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
      country: 'US'
    },
    billing_address: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
  
(Content truncated due to size limit. Use line ranges to read in chunks)