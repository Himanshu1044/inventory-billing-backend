import express from 'express'
import Contact from '../models/Contact.js'
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Get all contacts (customers and vendors)
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const { search, type, page = 1, limit = 10 } = req.query;
    const query = { businessId: req.businessId };

    // Add filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (type && ['customer', 'vendor'].includes(type)) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      contacts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
});

// Get single contact
router.get('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      businessId: req.businessId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact'
    });
  }
});

// Create new contact
router.post('/contacts', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, address, type } = req.body;

    // Validation
    if (!name || !phone || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and type are required'
      });
    }

    if (!['customer', 'vendor'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "customer" or "vendor"'
      });
    }

    // Check for duplicate phone within the same business
    const existingContact = await Contact.findOne({
      phone,
      businessId: req.businessId
    });

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact with this phone number already exists'
      });
    }

    const contact = new Contact({
      name,
      phone,
      email,
      address,
      type,
      businessId: req.businessId
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      contact
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact'
    });
  }
});

// Update contact
router.put('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, address, type } = req.body;

    // Validation
    if (type && !['customer', 'vendor'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "customer" or "vendor"'
      });
    }

    // Check for duplicate phone
    if (phone) {
      const existingContact = await Contact.findOne({
        phone,
        businessId: req.businessId,
        _id: { $ne: req.params.id }
      });

      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: 'Contact with this phone number already exists'
        });
      }
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      { name, phone, email, address, type },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact updated successfully',
      contact
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact'
    });
  }
});

// Delete contact
router.delete('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      businessId: req.businessId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact'
    });
  }
});

export default router;