// const mongoose = require('mongoose');
import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 15
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 100
  },
  address: {
    type: String,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    required: true,
    enum: ['customer', 'vendor']
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient searching
contactSchema.index({ name: 'text', email: 'text' });
contactSchema.index({ businessId: 1, type: 1 });
contactSchema.index({ businessId: 1, name: 1 });

// module.exports = mongoose.model('Contact', contactSchema);
const Contact = mongoose.model('Contact', contactSchema);
export default Contact;