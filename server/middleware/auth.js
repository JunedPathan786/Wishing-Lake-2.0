const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../utils/errors');

/**
 * Verify JWT access token and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extract token from Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Access denied. Please log in.', 401));
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
      }
      return next(new AppError('Invalid token. Please log in again.', 401));
    }

    // 3. Check user still exists and is active
    const user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact support.', 403));
    }

    if (!user.isApproved) {
      return next(new AppError('Your account is pending approval.', 403, 'PENDING_APPROVAL'));
    }

    // 4. Update last seen (non-blocking)
    User.findByIdAndUpdate(user._id, { lastSeen: new Date() }).exec();

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Restrict to specific roles
 */
const restrictTo = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

/**
 * Optional auth — attach user if token valid, but don't block if not
 */
const optionalAuth = async (req, _res, next) => {
  try {
    if (req.headers.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (_err) {
    // Silently fail — user just won't be attached
  }
  next();
};

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
    issuer: 'wishing-lake',
    audience: 'wishing-lake-client',
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    issuer: 'wishing-lake',
    audience: 'wishing-lake-client',
  });

  return { accessToken, refreshToken };
};

module.exports = { protect, restrictTo, optionalAuth, generateTokens };
