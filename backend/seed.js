require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Customer = require('./models/Customer');
const Gallon = require('./models/Gallon');
const Transaction = require('./models/Transaction');
const Admin = require('./models/Admin');
const { generateGallonCode } = require('./utils/generateCode');

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([Customer.deleteMany({}), Gallon.deleteMany({}), Transaction.deleteMany({}), Admin.deleteMany({})]);

  console.log('Creating default admin users...');
  await Admin.create({ username: 'admin', password: 'admin123' });
  await Admin.create({ username: 'aquamom', password: 'amws26' });
  console.log('  Admin credentials → username: admin / password: admin123');
  console.log('  Admin credentials → username: aquamom / password: amws26');


  console.log('Creating sample customers...');
  const customers = await Customer.insertMany([
    { name: 'Maria Santos', phone: '0917 123 4567', address: 'Blk 3 Lot 5, Quezon City' },
    { name: 'Juan Dela Cruz', phone: '0918 234 5678', address: 'Purok 2, Cainta, Rizal' },
    { name: 'Ana Reyes', phone: '0919 345 6789', address: 'Sitio Maligaya, Taytay, Rizal' },
    { name: 'Pedro Gonzales', phone: '0920 456 7890', address: 'Barangay San Isidro, Antipolo' },
  ]);

  console.log('Creating sample gallons...');
  const gallonSeeds = [
    { customer: customers[0]._id, deliveryStatus: 'delivered', paymentStatus: 'paid', locationStatus: 'with_customer' },
    { customer: customers[0]._id, deliveryStatus: 'undelivered', paymentStatus: 'unpaid', locationStatus: 'at_station' },
    { customer: customers[1]._id, deliveryStatus: 'delivered', paymentStatus: 'unpaid', locationStatus: 'with_customer' },
    { customer: customers[2]._id, deliveryStatus: 'undelivered', paymentStatus: 'unpaid', locationStatus: 'at_station' },
    { customer: customers[3]._id, deliveryStatus: 'delivered', paymentStatus: 'paid', locationStatus: 'with_customer' },
    { customer: null, deliveryStatus: 'undelivered', paymentStatus: 'unpaid', locationStatus: 'at_station' },
  ];

  for (const g of gallonSeeds) {
    const gallon = await Gallon.create({
      qrCode: generateGallonCode(),
      customer: g.customer,
      price: 30,
      deliveryStatus: g.deliveryStatus,
      paymentStatus: g.paymentStatus,
      locationStatus: g.locationStatus,
      lastScannedAt: new Date(),
    });
    await Transaction.create({
      gallon: gallon._id,
      customer: g.customer,
      action: 'registered',
      note: 'Seeded demo gallon.',
    });
  }

  console.log('Seed complete. Sample QR codes:');
  const gallons = await Gallon.find().select('qrCode');
  gallons.forEach((g) => console.log(' -', g.qrCode));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
