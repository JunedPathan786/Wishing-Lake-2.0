const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');

const wishSchema = new mongoose.Schema({
  wisherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Wish title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: [
      'Material', 'Message Delivery', 'Creative Gift', 'Custom Idea', 'Experience', 'Knowledge', 'Help',
      'health', 'love', 'career', 'family', 'travel', 'education', 'financial', 'personal_growth', 'community', 'creative', 'other'
    ],
    required: true
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative'],
    default: 0
  },
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR'],
    default: 'INR'
  },
  image: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Fulfilled', 'Cancelled', 'Rejected'],
    default: 'Pending'
  },
  fulfillerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  fulfillmentDetails: {
    acceptedAt: Date,
    completedAt: Date,
    notes: String
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: mongoose.Schema.Types.ObjectId,
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Encrypt sensitive wish data before saving
wishSchema.pre('save', function(next) {
  if (this.isModified('description') && process.env.ENCRYPTION_KEY) {
    // Optional: Encrypt description for extra privacy
    // this.description = CryptoJS.AES.encrypt(this.description, process.env.ENCRYPTION_KEY).toString();
  }
  next();
});

// Decrypt on retrieval if needed
wishSchema.methods.decryptDescription = function() {
  if (process.env.ENCRYPTION_KEY) {
    // const decrypted = CryptoJS.AES.decrypt(this.description, process.env.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    // return decrypted || this.description;
  }
  return this.description;
};

module.exports = mongoose.model('Wish', wishSchema);
