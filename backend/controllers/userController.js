const User = require('../models/User');
const FulfillmentRequest = require('../models/FulfillmentRequest');
const Notification = require('../models/Notification');


exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('wishesMade', 'title status category budget')
      .populate('wishesFulfilled', 'title status category budget');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, avatar },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ userId: req.user.id })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });

    const count = await Notification.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      notifications,
      unreadCount,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: Date.now() },
      { new: true }
    );

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true, readAt: Date.now() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getFulfillmentRequests = async (req, res) => {
  try {
    // Requests as wisher
    const asWisher = await FulfillmentRequest.find({ wisherId: req.user.id })
      .populate('wishId', 'title budget category')
      .populate('fulfillerId', 'name avatar')
      .sort({ createdAt: -1 });

    // Requests as fulfiller
    const asFulfiller = await FulfillmentRequest.find({ fulfillerId: req.user.id })
      .populate('wishId', 'title budget category')
      .populate('wisherId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      asWisher,
      asFulfiller
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.giveFulfillmentConsent = async (req, res) => {
  try {
    const request = await FulfillmentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Fulfillment request not found'
      });
    }

    const isWisher = request.wisherId.toString() === req.user.id;
    const isFulfiller = request.fulfillerId.toString() === req.user.id;

    if (!isWisher && !isFulfiller) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (isWisher) {
      request.wisherConsent = true;
      request.wisherConsentAt = Date.now();
    }
    if (isFulfiller) {
      request.fulfillerConsent = true;
      request.fulfillerConsentAt = Date.now();
    }

    // If both gave consent, reveal identities
    if (request.wisherConsent && request.fulfillerConsent && !request.identitiesRevealed) {
      request.identitiesRevealed = true;
      request.revealedAt = Date.now();

      // Send notifications
      await Notification.create({
        userId: request.wisherId,
        type: 'identity_revealed',
        title: 'Identity Revealed',
        message: 'Both users have consented. Identities are now revealed.',
        relatedId: { fulfillmentRequestId: request._id }
      });

      await Notification.create({
        userId: request.fulfillerId,
        type: 'identity_revealed',
        title: 'Identity Revealed',
        message: 'Both users have consented. Identities are now revealed.',
        relatedId: { fulfillmentRequestId: request._id }
      });
    }

    await request.save();

    res.json({
      success: true,
      message: 'Consent recorded',
      identitiesRevealed: request.identitiesRevealed,
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.rateFulfillment = async (req, res) => {
  try {
    const { score, review } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating score must be between 1 and 5'
      });
    }

    const request = await FulfillmentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Fulfillment request not found'
      });
    }

    const isWisher = request.wisherId.toString() === req.user.id;
    const isFulfiller = request.fulfillerId.toString() === req.user.id;

    if (!isWisher && !isFulfiller) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (isWisher) {
      request.rating.byWisher = {
        score,
        review: review || '',
        createdAt: Date.now()
      };
    } else {
      request.rating.byFulfiller = {
        score,
        review: review || '',
        createdAt: Date.now()
      };
    }

    await request.save();

    // Update user's average rating
    const ratings = await FulfillmentRequest.aggregate([
      {
        $match: {
          fulfillerId: request.fulfillerId,
          'rating.byWisher': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating.byWisher.score' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (ratings.length > 0) {
      await User.findByIdAndUpdate(request.fulfillerId, {
        'stats.averageRating': ratings[0].avgRating,
        'stats.totalRatings': ratings[0].count
      });
    }

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      stats: user.stats,
      badges: user.badges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};