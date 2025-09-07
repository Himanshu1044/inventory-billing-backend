import express from 'express'
import Product from '../models/Product.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Get all products for the businessS
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;
    const query = { businessId: req.businessId };

    // Add search filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Get single product
router.get('/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      businessId: req.businessId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// Create new product
router.post('/products', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;

    // Validation
    if (!name || price === undefined || stock === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, stock, and category are required'
      });
    }

    if (price < 0 || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price and stock cannot be negative'
      });
    }

    const product = new Product({
      name,
      description,
      price,
      stock,
      category,
      businessId: req.businessId
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// Update product
router.put('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;

    // Validation
    if (price !== undefined && price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative'
      });
    }

    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock cannot be negative'
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      { name, description, price, stock, category },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// Delete product
router.delete('/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      businessId: req.businessId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

// Update product stock (increase/decrease)
router.patch('/products/:id/stock', authenticateToken, async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'increase' or 'decrease'

    if (!quantity || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and operation are required'
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      businessId: req.businessId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (operation === 'increase') {
      product.stock += quantity;
    } else if (operation === 'decrease') {
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      product.stock -= quantity;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "increase" or "decrease"'
      });
    }

    await product.save();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      product
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock'
    });
  }
});

export default router;