const Wish = require('../models/Wish');
const User = require('../models/User');
const FulfillmentRequest = require('../models/FulfillmentRequest');

exports.createWish = async (req, res) => {
  try {
    const { title, description, category, budget, isPublic, image } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category'
      });
    }

    const wish = await Wish.create({
      wisherId: req.user.id,
      title,
      description,
      category,
      budget: budget || 0,
      isPublic: isPublic !== false,
      image: image || ''
    });

    // Add to user's wishes
    await User.findByIdAndUpdate(req.user.id, {
      $push: { wishesMade: wish._id },
      $inc: { 'stats.totalWishesMade': 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Wish created successfully',
      wish
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
    const { page = 1, limit = 10, category, search } = req.query;
    
    const query = {
      isPublic: true,
      status: { $in: ['Pending', 'Accepted'] }
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const wishes = await Wish.find(query)
      .populate('wisherId', 'name avatar')
      .populate('fulfillerId', 'name avatar')
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

exports.getWishById = async (req, res) => {
  try {
    const wish = await Wish.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('wisherId', 'name avatar')
      .populate('fulfillerId', 'name avatar');

    if (!wish) {
      return res.status(404).json({
        success: false,
        message: 'Wish not found'
      });
    }

    res.json({
      success: true,
      wish
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createFulfillmentRequest = async (req, res) => {
  try {
    const { message } = req.body;
    const wishId = req.params.id;

    const wish = await Wish.findById(wishId);
    if (!wish) {
      return res.status(404).json({
        success: false,
        message: 'Wish not found'
      });
    }

    // Check if user is the wisher
    if (wish.wisherId.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot fulfill your own wish'
      });
    }

    // Check if request already exists
    const existingRequest = await FulfillmentRequest.findOne({
      wishId,
      fulfillerId: req.user.id,
      status: { $in: ['Pending', 'Approved'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this wish'
      });
    }

    const fulfillmentRequest = await FulfillmentRequest.create({
      wishId,
      wisherId: wish.wisherId,
      fulfillerId: req.user.id,
      message: message || ''
    });

    res.status(201).json({
      success: true,
      message: 'Fulfillment request created. Awaiting admin approval.',
      fulfillmentRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyWishes = async (req, res) => {
  try {
    const wishes = await Wish.find({ wisherId: req.user.id })
      .populate('fulfillerId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      wishes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getFulfillingWishes = async (req, res) => {
  try {
    const wishes = await Wish.find({ fulfillerId: req.user.id })
      .populate('wisherId', 'name avatar email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      wishes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSavedWishes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedWishes');

    res.json({
      success: true,
      wishes: user.savedWishes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.saveWish = async (req, res) => {
  try {
    const wish = await Wish.findById(req.params.id);
    if (!wish) {
      return res.status(404).json({
        success: false,
        message: 'Wish not found'
      });
    }

    const user = await User.findById(req.user.id);
    const isSaved = user.savedWishes.includes(req.params.id);

    if (isSaved) {
      user.savedWishes = user.savedWishes.filter(id => id.toString() !== req.params.id);
    } else {
      user.savedWishes.push(req.params.id);
    }

    await user.save();

    res.json({
      success: true,
      message: isSaved ? 'Wish removed from saved' : 'Wish saved',
      isSaved: !isSaved
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.likeWish = async (req, res) => {
  try {
    const wish = await Wish.findById(req.params.id);
    if (!wish) {
      return res.status(404).json({
        success: false,
        message: 'Wish not found'
      });
    }

    const isLiked = wish.likes.includes(req.user.id);

    if (isLiked) {
      wish.likes = wish.likes.filter(id => id.toString() !== req.user.id);
    } else {
      wish.likes.push(req.user.id);
    }

    await wish.save();

    res.json({
      success: true,
      message: isLiked ? 'Like removed' : 'Wish liked',
      isLiked: !isLiked,
      likesCount: wish.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateWish = async (req, res) => {
  try {
    let wish = await Wish.findById(req.params.id);

    if (!wish) {
      return res.status(404).json({
        success: false,
        message: 'Wish not found'
      });
    }

    if (wish.wisherId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this wish'
      });
    }

    // Only allow editing if status is Pending
    if (wish.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only edit pending wishes'
      });
    }

    const { title, description, category, budget, isPublic } = req.body;

    wish = await Wish.findByIdAndUpdate(
      req.params.id,
      { title, description, category, budget, isPublic },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Wish updated successfully',
      wish
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteWish = async (req, res) => {
  try {
    const wish = await Wish.findById(req.params.id);

    if (!wish) {
      return res.status(404).json({
        success: false,
        message: 'Wish not found'
      });
    }

    if (wish.wisherId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await Wish.findByIdAndDelete(req.params.id);
    
    // Remove from user's wishes
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { wishesMade: req.params.id }
    });

    res.json({
      success: true,
      message: 'Wish deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};