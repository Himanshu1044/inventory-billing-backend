import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['sale', 'purchase']
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: function () { return this.type === 'sale'; }
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: function () { return this.type === 'purchase'; }
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient querying
transactionSchema.index({ businessId: 1, type: 1 })
transactionSchema.index({ businessId: 1, date: -1 })
transactionSchema.index({ customerId: 1, date: -1 })
transactionSchema.index({ vendorId: 1, date: -1 })

const Transaction = mongoose.model('Transaction', transactionSchema)
export default Transaction;