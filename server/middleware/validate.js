const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errors');

/**
 * Middleware that checks express-validator results
 * and short-circuits with a 400 if any validation failed.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join('. ');
    return next(new AppError(messages, 400));
  }
  next();
};

module.exports = { validate };
