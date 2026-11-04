// Creates (or upgrades) a local demo admin using ADMIN_* values from your .env file.
// Run with: npm run create-admin
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

async function run() {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'BloodConnect Admin' } = process.env;
  if (!MONGO_URI) throw new Error('MONGO_URI is missing in .env');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
  if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters');

  await mongoose.connect(MONGO_URI);
  let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (admin) {
    admin.role = 'admin';
    admin.isActive = true;
    admin.password = ADMIN_PASSWORD; // hashed by the model before saving
    await admin.save();
    console.log(`Existing user upgraded to admin: ${admin.email}`);
  } else {
    admin = await User.create({
      name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
      phone: '9000000000', role: 'admin', city: 'Coimbatore',
    });
    console.log(`Admin created: ${admin.email}`);
  }
  console.log('You can now log in with the ADMIN_EMAIL / ADMIN_PASSWORD from your .env file.');
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e.message); process.exit(1); });
