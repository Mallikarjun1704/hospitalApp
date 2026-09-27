const User = require('../models/User');

/**
 * Checks whether an administrator account exists in the database.
 * If no admin exists, the frontend will show the "Create Admin Account"
 * form on the login page for one-time initial setup.
 * No auto-seeding — the first admin must be created via the UI.
 */
async function seedAdminUser() {
  try {
    const adminUser = await User.findOne({ userType: 'admin' });

    if (!adminUser) {
      console.log('[DB SEED] No admin account found.');
      console.log('[DB SEED] Visit the app to create the first admin account via the login page.');
    } else {
      console.log(`[DB SEED] Admin account verified (ID: ${adminUser._id}, Email: ${adminUser.email}).`);
    }
  } catch (error) {
    console.error('[DB SEED] Error checking admin user:', error.message);
  }
}

module.exports = seedAdminUser;
