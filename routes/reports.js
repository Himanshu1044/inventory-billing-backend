import express from 'express'
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Get inventory report
router.get('/reports/inventory', authenticateToken, async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    const query = { businessId: req.businessId };

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (lowStock) {
      query.stock = { $lte: parseInt(lowStock) };
    }

    const products = await Product.find(query)
      .sort({ category: 1, name: 1 });

    // Calculate summary statistics
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const lowStockItems = products.filter(product => product.stock <= 10).length;
    const outOfStockItems = products.filter(product => product.stock === 0).length;

    // Group by category
    const categoryBreakdown = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = {
          count: 0,
          totalValue: 0,
          totalStock: 0
        };
      }
      acc[product.category].count++;
      acc[product.category].totalValue += product.price * product.stock;
      acc[product.category].totalStock += product.stock;
      return acc;
    }, {});

    res.json({
      success: true,
      report: {
        summary: {
          totalProducts,
          totalValue: Math.round(totalValue * 100) / 100,
          lowStockItems,
          outOfStockItems
        },
        categoryBreakdown,
        products
      }
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory report'
    });
  }
});

// Get transactions report
router.get('/reports/transactions', authenticateToken, async (req, res) => {
  try {
    const { type, startDate, endDate, customerId, vendorId } = req.query;
    const query = { businessId: req.businessId };

    // Add filters
    if (type && ['sale', 'purchase'].includes(type)) {
      query.type = type;
    }

    if (customerId) {
      query.customerId = customerId;
    }

    if (vendorId) {
      query.vendorId = vendorId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('customerId', 'name phone')
      .populate('vendorId', 'name phone')
      .populate('products.productId', 'name category')
      .sort({ date: -1 });

    // Calculate summary statistics
    const totalTransactions = transactions.length;
    const totalSales = transactions.filter(t => t.type === 'sale').length;
    const totalPurchases = transactions.filter(t => t.type === 'purchase').length;
    
    const totalSalesAmount = transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const totalPurchaseAmount = transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    // Daily breakdown
    const dailyBreakdown = transactions.reduce((acc, transaction) => {
      const date = transaction.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          sales: { count: 0, amount: 0 },
          purchases: { count: 0, amount: 0 }
        };
      }
      
      acc[date][transaction.type + 's'].count++;
      acc[date][transaction.type + 's'].amount += transaction.totalAmount;
      return acc;
    }, {});

    // Top products (by quantity sold/purchased)
    const productStats = {};
    transactions.forEach(transaction => {
      transaction.products.forEach(item => {
        const productId = item.productId._id.toString();
        const productName = item.productId.name;
        
        if (!productStats[productId]) {
          productStats[productId] = {
            name: productName,
            category: item.productId.category,
            totalQuantity: 0,
            totalValue: 0,
            salesQuantity: 0,
            purchaseQuantity: 0
          };
        }
        
        productStats[productId].totalQuantity += item.quantity;
        productStats[productId].totalValue += item.quantity * item.price;
        
        if (transaction.type === 'sale') {
          productStats[productId].salesQuantity += item.quantity;
        } else {
          productStats[productId].purchaseQuantity += item.quantity;
        }
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    res.json({
      success: true,
      report: {
        summary: {
          totalTransactions,
          totalSales,
          totalPurchases,
          totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
          totalPurchaseAmount: Math.round(totalPurchaseAmount * 100) / 100,
          netAmount: Math.round((totalSalesAmount - totalPurchaseAmount) * 100) / 100
        },
        dailyBreakdown,
        topProducts,
        transactions
      }
    });
  } catch (error) {
    console.error('Transactions report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate transactions report'
    });
  }
});

// Get customer/vendor transaction history
router.get('/reports/contact/:contactId', authenticateToken, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { startDate, endDate } = req.query;

    // Find contact to determine type
    const Contact = require('../models/Contact');
    const contact = await Contact.findOne({
      _id: contactId,
      businessId: req.businessId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const query = { businessId: req.businessId };
    
    if (contact.type === 'customer') {
      query.customerId = contactId;
      query.type = 'sale';
    } else {
      query.vendorId = contactId;
      query.type = 'purchase';
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('products.productId', 'name category')
      .sort({ date: -1 });

    // Calculate summary
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    
    const productBreakdown = {};
    transactions.forEach(transaction => {
      transaction.products.forEach(item => {
        const productName = item.productId.name;
        if (!productBreakdown[productName]) {
          productBreakdown[productName] = {
            quantity: 0,
            amount: 0
          };
        }
        productBreakdown[productName].quantity += item.quantity;
        productBreakdown[productName].amount += item.quantity * item.price;
      });
    });

    res.json({
      success: true,
      report: {
        contact,
        summary: {
          totalTransactions,
          totalAmount: Math.round(totalAmount * 100) / 100
        },
        productBreakdown,
        transactions
      }
    });
  } catch (error) {
    console.error('Contact report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate contact report'
    });
  }
});

export default router