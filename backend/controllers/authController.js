const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


exports.register = async (req, res) => {
  try {
    const { name, username, displayName, email, password, confirmPassword } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const resolvedName = (name || displayName || username || '').trim();

    if (!resolvedName || !normalizedEmail || !password) {
      return res.status(401).json({
        success: false,
        message: 'Please provide name/username, email, and password'
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(401).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(401).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(401).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({ name: resolvedName, email: normalizedEmail, password });

    // Generate token
    const token = generateToken(user._id);

    const userPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userPayload,
      data: {
        user: userPayload,
        accessToken: token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    // Validation
    if (!normalizedEmail || !password) {
      return res.status(401).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact support.'
      });
    }

    // Defensive guard: legacy or broken records without password should not crash login
    if (!user.password || typeof user.comparePassword !== 'function') {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    const userPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userPayload,
      // Keep compatibility with the client auth contract.
      data: {
        user: userPayload,
        accessToken: token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.profile = async (req, res) => {
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

exports.logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetTokenExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save();

    // Send email (placeholder - configure Nodemailer with your SMTP)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    res.json({
      success: true,
      message: 'Reset link sent to email',
      resetToken // In production, only send via email
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const resetToken = req.params.resetToken;

    if (password !== confirmPassword) {
      return res.status(401).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    const user = await User.findOne({
      resetToken: resetTokenHash,
      resetTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successful',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};