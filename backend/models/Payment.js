const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wish',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: {
    type: String,
    unique: true,
    sparse: true
  },
  signature: {
    type: String,
    sparse: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR'],
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['Created', 'Pending', 'Paid', 'Failed', 'Cancelled', 'Refunded'],
    default: 'Created'
  },
  gateway: {
    type: String,
    enum: ['Razorpay', 'Stripe'],
    default: 'Razorpay'
  },
  paymentMethod: {
    type: String,
    default: ''
  },
  receiptId: {
    type: String,
    sparse: true
  },
  failureReason: {
    type: String,
    default: ''
  },
  refundId: {
    type: String,
    sparse: true
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ paymentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);