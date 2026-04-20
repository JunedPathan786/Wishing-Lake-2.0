const User = require('../models/User');
const logger = require('./logger');

exports.seedAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) return;

    await User.create({
      username: 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@wishinglake.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@SecurePass123',
      displayName: 'Lake Guardian',
      role: 'admin',
      isVerified: true,
      isApproved: true,
    });

    logger.info('✅ Admin user seeded successfully.');
  } catch (err) {
    logger.error(`Admin seed failed: ${err.message}`);
  }
};
