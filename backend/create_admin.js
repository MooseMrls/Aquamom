require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

async function createAdminAccount() {
  await connectDB();

  const username = 'aquamom';
  const password = 'amws26';

  let admin = await Admin.findOne({ username });
  if (admin) {
    admin.password = password;
    await admin.save();
    console.log(`Updated existing admin account "${username}".`);
  } else {
    await Admin.create({ username, password });
    console.log(`Successfully created new admin account "${username}".`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

createAdminAccount().catch((err) => {
  console.error('Failed to create admin account:', err);
  process.exit(1);
});
