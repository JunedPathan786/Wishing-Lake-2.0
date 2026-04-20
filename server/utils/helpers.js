/**
 * Wraps an async route handler and forwards any rejection to next().
 * Usage: router.get('/path', catchAsync(async (req, res) => { ... }))
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Paginate a Mongoose query.
 * Returns { data, total, page, pages, limit }
 */
const paginate = async (Model, query, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    populate = [],
    select = '',
  } = options;

  const skip = (page - 1) * limit;
  const total = await Model.countDocuments(query);

  let q = Model.find(query).sort(sort).skip(skip).limit(parseInt(limit));
  if (select) q = q.select(select);
  populate.forEach((p) => { q = q.populate(p); });

  const data = await q.lean();

  return {
    data,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit),
    hasMore: page < Math.ceil(total / limit),
  };
};

/**
 * Build a MongoDB filter object from query params
 * Safely ignores undefined/null values
 */
const buildFilter = (params) => {
  const filter = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      filter[key] = value;
    }
  });
  return filter;
};

/**
 * Strip sensitive fields from a plain object
 */
const sanitizeUser = (user) => {
  const { password, refreshToken, emailVerificationToken, passwordResetToken, ...safe } = user;
  return safe;
};

module.exports = { catchAsync, paginate, buildFilter, sanitizeUser };
