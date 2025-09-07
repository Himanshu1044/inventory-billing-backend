import express from 'express'
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import Contact from '../models/Contact.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Get all transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { type, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = { businessId: req.businessId };

    // Add filters
    if (type && ['sale', 'purchase'].includes(type)) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const transactions = await Transaction.find(query)
      .populate('customerId', 'name phone')
      .populate('vendorId', 'name phone')
      .populate('products.productId', 'name category')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// Get single transaction
router.get('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      businessId: req.businessId
    })
    .populate('customerId', 'name phone email address')
    .populate('vendorId', 'name phone email address')
    .populate('products.productId', 'name category price');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction'
    });
  }
});

// Create new transaction (without MongoDB transactions for standalone compatibility)
router.post('/transactions', authenticateToken, async (req, res) => {
  try {
    const { type, customerId, vendorId, products } = req.body;

    // Validation
    if (!type || !['sale', 'purchase'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid transaction type is required'
      });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required'
      });
    }

    // Validate contact based on transaction type
    if (type === 'sale' && !customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required for sales'
      });
    }

    if (type === 'purchase' && !vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required for purchases'
      });
    }

    // Validate contact exists and belongs to business
    if (customerId) {
      const customer = await Contact.findOne({
        _id: customerId,
        businessId: req.businessId,
        type: 'customer'
      });

      if (!customer) {
        return res.status(400).json({
          success: false,
          message: 'Customer not found'
        });
      }
    }

    if (vendorId) {
      const vendor = await Contact.findOne({
        _id: vendorId,
        businessId: req.businessId,
        type: 'vendor'
      });

      if (!vendor) {
        return res.status(400).json({
          success: false,
          message: 'Vendor not found'
        });
      }
    }

    let totalAmount = 0;
    const validatedProducts = [];

    // Validate products and calculate total
    for (const item of products) {
      const { productId, quantity, price } = item;

      if (!productId || !quantity || price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Product ID, quantity, and price are required for each product'
        });
      }

      if (quantity <= 0 || price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be positive and price cannot be negative'
        });
      }

      const product = await Product.findOne({
        _id: productId,
        businessId: req.businessId
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${productId} not found`
        });
      }

      // Check stock for sales
      if (type === 'sale' && product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Required: ${quantity}`
        });
      }

      validatedProducts.push({
        productId,
        quantity,
        price
      });

      totalAmount += quantity * price;
    }

    // Update product stock first
    for (const item of validatedProducts) {
      const stockUpdate = type === 'sale' ? -item.quantity : item.quantity;
      
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: stockUpdate } }
      );
    }

    // Create transaction
    const transaction = new Transaction({
      type,
      customerId: type === 'sale' ? customerId : undefined,
      vendorId: type === 'purchase' ? vendorId : undefined,
      products: validatedProducts,
      totalAmount,
      businessId: req.businessId
    });

    await transaction.save();

    // Populate the created transaction for response
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('customerId', 'name phone')
      .populate('vendorId', 'name phone')
      .populate('products.productId', 'name category');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction: populatedTransaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    
    // Note: In a production environment with replica sets, you'd want to use
    // MongoDB transactions to ensure atomicity and rollback on errors
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction'
    });
  }
});

export default router;