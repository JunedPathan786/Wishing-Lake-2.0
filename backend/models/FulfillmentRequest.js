const mongoose = require('mongoose');

const fulfillmentRequestSchema = new mongoose.Schema({
  wishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wish',
    required: true
  },
  wisherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fulfillerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  message: {
    type: String,
    maxlength: 500
  },
  wisherConsent: {
    type: Boolean,
    default: false
  },
  fulfillerConsent: {
    type: Boolean,
    default: false
  },
  wisherConsentAt: Date,
  fulfillerConsentAt: Date,
  identitiesRevealed: {
    type: Boolean,
    default: false
  },
  revealedAt: Date,
  rating: {
    byWisher: {
      score: {
        type: Number,
        min: 1,
        max: 5
      },
      review: String,
      createdAt: Date
    },
    byFulfiller: {
      score: {
        type: Number,
        min: 1,
        max: 5
      },
      review: String,
      createdAt: Date
    }
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    sparse: true
  }
}, {
  timestamps: true
});

// Index for quick queries
fulfillmentRequestSchema.index({ wishId: 1, status: 1 });
fulfillmentRequestSchema.index({ wisherId: 1, status: 1 });
fulfillmentRequestSchema.index({ fulfillerId: 1, status: 1 });

module.exports = mongoose.model('FulfillmentRequest', fulfillmentRequestSchema);
