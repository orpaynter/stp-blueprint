const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Service = require('../models/Service');
const auth = require('../../user-service/middleware/auth');

// @route   POST api/orders
// @desc    Create a new order
// @access  Private
router.post('/', [
  auth,
  [
    check('items', 'Items are required').isArray().not().isEmpty(),
    check('items.*.type', 'Item type is required').isIn(['product', 'service']),
    check('items.*.itemId', 'Item ID is required').not().isEmpty(),
    check('items.*.quantity', 'Quantity is required').isNumeric(),
    check('subtotal', 'Subtotal is required').isNumeric(),
    check('total', 'Total is required').isNumeric()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      items,
      projectId,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      currency,
      shippingAddress,
      billingAddress,
      notes
    } = req.body;

    // Validate items and get seller IDs
    const itemDetails = [];
    let orderType = 'product';
    let sellerId = null;

    for (const item of items) {
      let itemData;
      
      if (item.type === 'product') {
        itemData = await Product.findById(item.itemId);
        if (!itemData) {
          return res.status(404).json({ msg: `Product with ID ${item.itemId} not found` });
        }
        
        // Check if product is available
        if (itemData.status !== 'active') {
          return res.status(400).json({ msg: `Product ${itemData.name} is not available` });
        }
        
        // Check inventory
        if (!itemData.inventory.unlimited && itemData.inventory.quantity < item.quantity) {
          return res.status(400).json({ msg: `Not enough inventory for ${itemData.name}` });
        }
        
        // Set seller ID if not set yet
        if (!sellerId) {
          sellerId = itemData.sellerId;
        } else if (sellerId.toString() !== itemData.sellerId.toString()) {
          // If different seller, it's a mixed order
          orderType = 'mixed';
        }
        
        // Add item details
        itemDetails.push({
          type: 'product',
          itemId: itemData._id,
          name: itemData.name,
          quantity: item.quantity,
          unitPrice: itemData.price.amount,
          total: itemData.price.amount * item.quantity
        });
      } else if (item.type === 'service') {
        itemData = await Service.findById(item.itemId);
        if (!itemData) {
          return res.status(404).json({ msg: `Service with ID ${item.itemId} not found` });
        }
        
        // Check if service is available
        if (itemData.status !== 'active') {
          return res.status(400).json({ msg: `Service ${itemData.name} is not available` });
        }
        
        // Set seller ID if not set yet
        if (!sellerId) {
          sellerId = itemData.providerId;
          orderType = 'service';
        } else if (sellerId.toString() !== itemData.providerId.toString()) {
          // If different seller, it's a mixed order
          orderType = 'mixed';
        }
        
        // Add item details
        itemDetails.push({
          type: 'service',
          itemId: itemData._id,
          name: itemData.name,
          quantity: item.quantity,
          unitPrice: itemData.price.amount,
          total: itemData.price.amount * item.quantity
        });
      }
    }

    // Create new order
    const newOrder = new Order({
      buyerId: req.user.id,
      sellerId,
      projectId,
      orderType,
      items: itemDetails,
      subtotal,
      tax: tax || 0,
      shipping: shipping || 0,
      discount: discount || 0,
      total,
      currency: currency || 'USD',
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress,
      billingAddress,
      notes
    });

    const order = await newOrder.save();
    
    // Update inventory for products
    for (const item of items) {
      if (item.type === 'product') {
        const product = await Product.findById(item.itemId);
        if (product && !product.inventory.unlimited) {
          product.inventory.quantity -= item.quantity;
          if (product.inventory.quantity <= 0) {
            product.status = 'out_of_stock';
          }
          await product.save();
        }
      }
    }
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/orders
// @desc    Get all orders for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let orders;
    const { role } = req.query;
    
    if (role === 'buyer') {
      // Get orders where user is buyer
      orders = await Order.find({ buyerId: req.user.id })
        .sort({ createdAt: -1 });
    } else if (role === 'seller') {
      // Get orders where user is seller
      orders = await Order.find({ sellerId: req.user.id })
        .sort({ createdAt: -1 });
    } else {
      // Get all orders related to user
      orders = await Order.find({
        $or: [
          { buyerId: req.user.id },
          { sellerId: req.user.id }
        ]
      }).sort({ createdAt: -1 });
    }
    
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/orders/project/:projectId
// @desc    Get all orders for a project
// @access  Private
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const orders = await Order.find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Check if user has access to this order
    const hasAccess = 
      req.user.id === order.buyerId.toString() || 
      req.user.id === order.sellerId.toString();
    
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Not authorized to access this order' });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Order not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', [
  auth,
  [
    check('status', 'Status is required').isIn(['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Check if user has permission to update this order
    const isSeller = req.user.id === order.sellerId.toString();
    const isBuyer = req.user.id === order.buyerId.toString();
    
    if (!isSeller && !isBuyer) {
      return res.status(403).json({ msg: 'Not authorized to update this order' });
    }

    // Some status changes can only be done by seller
    const { status, note } = req.body;
    const sellerOnlyStatuses = ['processing', 'shipped'];
    
    if (sellerOnlyStatuses.includes(status) && !isSeller) {
      return res.status(403).json({ msg: `Only the seller can set order to ${status}` });
    }

    // Some status changes can only be done by buyer
    const buyerOnlyStatuses = ['completed'];
    
    if (buyerOnlyStatuses.includes(status) && !isBuyer) {
      return res.status(403).json({ msg: `Only the buyer can set order to ${status}` });
    }

    // Update status
    order.status = status;
    
    // Add to timeline
    order.timeline.push({
      status,
      date: new Date(),
      note: note || `Status updated to ${status}`
    });

    await order.save();
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Order not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/orders/:id/tracking
// @desc    Add tracking information to an order
// @access  Private (Seller only)
router.put('/:id/tracking', [
  auth,
  [
    check('trackingNumber', 'Tracking number is required').not().isEmpty(),
    check('carrier', 'Carrier is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Check if user is the seller
    if (req.user.id !== order.sellerId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to update this order' });
    }

    const { trackingNumber, carrier, estimatedDelivery } = req.body;

    // Update tracking info
    order.trackingNumber = trackingNumber;
    order.carrier = carrier;
    if (estimatedDelivery) {
      order.estimatedDelivery = estimatedDelivery;
    }

    // Update status to shipped if it's not already
    if (order.status === 'processing' || order.status === 'pending') {
      order.status = 'shipped';
      order.timeline.push({
        status: 'shipped',
        date: new Date(),
        note: `Order shipped via ${carrier} with tracking number ${trackingNumber}`
      });
    }

    await order.save();
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Order not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Check if user has permission to cancel this order
    const isSeller = req.user.id === order.sellerId.toString();
    const isBuyer = req.user.id === order.buyerId.toString();
    
    if (!isSeller && !isBuyer) {
      return res.status(403).json({ msg: 'Not authorized to cancel this order' });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ msg: `Order cannot be cancelled because it is in ${order.status} status` });
    }

    // Update status to cancelled
    order.status = 'cancelled';
    
    // Add to timeline
    order.timeline.push({
      status: 'cancelled',
      date: new Date(),
      note: req.body.note || `Order cancelled by ${isBuyer ? 'buyer' : 'seller'}`
    });

    // Restore inventory for products
    for (const item of order.items) {
      if (item.type === 'product') {
        const product = await Product.findById(item.itemId);
        if (product && !product.inventory.unlimited) {
          product.inventory.quantity += item.quantity;
          if (product.status === 'out_of_stock' && product.inventory.quantity > 0) {
            product.status = 'active';
          }
          await product.save();
        }
      }
    }

    await order.save();
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Order not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
