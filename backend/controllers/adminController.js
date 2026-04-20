const User = require('../models/User');
const Wish = require('../models/Wish');
const Payment = require('../models/Payment');
const FulfillmentRequest = require('../models/FulfillmentRequest');
const Notification = require('../models/Notification');

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const users = await User.find()
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments();

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllWishes = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const wishes = await Wish.find(query)
      .populate('wisherId', 'name email')
      .populate('fulfillerId', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Wish.countDocuments(query);

    res.json({
      success: true,
      wishes,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalWishes: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllFulfillmentRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const requests = await FulfillmentRequest.find(query)
      .populate('wishId', 'title budget')
      .populate('wisherId', 'name email')
      .populate('fulfillerId', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await FulfillmentRequest.countDocuments(query);

    res.json({
      success: true,
      requests,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalRequests: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.approveFulfillmentRequest = async (req, res) => {
  try {
    const request = await FulfillmentRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'Approved' },
      { new: true }
    ).populate('wishId');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Update wish status
    await Wish.findByIdAndUpdate(request.wishId, { status: 'Accepted' });

    // Send notifications
    await Notification.create({
      userId: request.wisherId,
      type: 'approval_granted',
      title: 'Fulfillment Request Approved',
      message: 'Your wish fulfillment request has been approved!',
      relatedId: { fulfillmentRequestId: request._id }
    });

    res.json({
      success: true,
      message: 'Fulfillment request approved',
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.rejectFulfillmentRequest = async (req, res) => {
  try {
    const { reason } = req.body;

    const request = await FulfillmentRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected' },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Send notifications
    await Notification.create({
      userId: request.fulfillerId,
      type: 'approval_denied',
      title: 'Fulfillment Request Rejected',
      message: reason || 'Your fulfillment request has been rejected',
      relatedId: { fulfillmentRequestId: request._id }
    });

    res.json({
      success: true,
      message: 'Fulfillment request rejected',
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: user.isActive ? 'User unblocked' : 'User blocked',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalWishes = await Wish.countDocuments();
    const fulfilledWishes = await Wish.countDocuments({ status: 'Fulfilled' });
    const totalPayments = await Payment.countDocuments({ status: 'Paid' });
    const totalRevenue = (await Payment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]))[0]?.total || 0;

    const wishesByCategory = await Wish.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const monthlyWishes = await Wish.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalWishes,
        fulfilledWishes,
        fulfillmentRate: totalWishes > 0 ? ((fulfilledWishes / totalWishes) * 100).toFixed(2) + '%' : '0%',
        totalPayments,
        totalRevenue,
        wishesByCategory,
        monthlyWishes
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getWishDetails = async (req, res) => {
  try {
    const wish = await Wish.findById(req.params.id)
      .populate('wisherId', 'name email')
      .populate('fulfillerId', 'name email');

    if (!wish) {
      return res.status(404).json({
        success: false,
        message: 'Wish not found'
      });
    }

    const fulfillmentRequests = await FulfillmentRequest.find({ wishId: wish._id })
      .populate('fulfillerId', 'name email');

    res.json({
      success: true,
      wish,
      fulfillmentRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
