/**
 * Seed script – creates an admin user and a demo user for quick testing.
 * Run: node seed.js (requires MongoDB running)
 */
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();
await connectDB();

try {
  const adminEmail = 'admin@lifequest.app';
  const demoEmail = 'demo@lifequest.app';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: 'admin123',
      role: 'admin',
      xp: 500,
      level: 5,
      coins: 200,
      currentStreak: 12,
      longestStreak: 30,
    });
    console.log('Admin created:', adminEmail, '/ admin123');
  } else {
    console.log('Admin already exists');
  }

  let demo = await User.findOne({ email: demoEmail });
  if (!demo) {
    demo = await User.create({
      name: 'Demo Hero',
      email: demoEmail,
      password: 'demo123',
      xp: 120,
      level: 2,
      coins: 50,
      currentStreak: 3,
      longestStreak: 7,
    });
    console.log('Demo user created:', demoEmail, '/ demo123');
  } else {
    console.log('Demo user already exists');
  }

  console.log('Seed complete');
} catch (e) {
  console.error(e);
} finally {
  process.exit(0);
}
