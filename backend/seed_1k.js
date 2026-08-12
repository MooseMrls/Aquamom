require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Customer = require('./models/Customer');
const Gallon = require('./models/Gallon');
const Transaction = require('./models/Transaction');
const Admin = require('./models/Admin');
const { generateGallonCode } = require('./utils/generateCode');

const FIRST_NAMES = [
  'Maria', 'Juan', 'Ana', 'Pedro', 'Joseph', 'Mark', 'Christine', 'Joshua', 'Angela', 'Daniel',
  'Princess', 'Christian', 'John', 'Nicole', 'Gabriel', 'Grace', 'Miguel', 'Patricia', 'Alexander', 'Samantha',
  'Emmanuel', 'Stephanie', 'Christopher', 'Michelle', 'Anthony', 'Janice', 'Francis', 'Rachelle', 'Kenneth', 'Bea',
  'Jerome', 'Kimberly', 'Paolo', 'Camille', 'Dominic', 'Erika', 'Rafael', 'Alyssa', 'Justin', 'Katrina',
  'Tin', 'Carlo', 'Jasmine', 'Rene', 'Luz', 'Lito', 'Gemma', 'Noli', 'Cora', 'Ramon'
];

const LAST_NAMES = [
  'Santos', 'Dela Cruz', 'Reyes', 'Gonzales', 'Ramos', 'Mendoza', 'Flores', 'Garcia', 'Cruz',
  'Bautista', 'Villanueva', 'Castro', 'Rivera', 'Aquino', 'Navarro', 'Mercado', 'Salazar', 'Del Rosario',
  'Perez', 'Torres', 'Fernandez', 'Domingo', 'Sison', 'Valenzuela', 'Tolentino', 'Morales', 'Espiritu', 'Corpuz'
];

const LOCATIONS = [
  'Quezon City', 'Antipolo, Rizal', 'Taytay, Rizal', 'Cainta, Rizal', 'Pasig City',
  'Marikina City', 'Taguig City', 'Mandaluyong City', 'Caloocan City', 'San Mateo, Rizal'
];

const STREETS = [
  'Blk 1 Lot 12, San Isidro', 'Purok 3, Katipunan', 'Sitio Maligaya', '142 Rizal Avenue',
  'Blk 5 Lot 8, Mahogany St.', '23 Sampaguita St.', 'Purok 1, Mayamot', '67 Bonifacio St.',
  'Blk 10 Lot 4, Villa Verde', '89 Mabini St.', 'Purok 4, Bagong Nayon', '12 Narra St.'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPhone() {
  const prefixes = ['0917', '0918', '0919', '0920', '0927', '0939', '0945', '0998'];
  const num = Math.floor(1000000 + Math.random() * 9000000);
  return `${getRandomItem(prefixes)} ${num.toString().substring(0, 3)} ${num.toString().substring(3)}`;
}

async function seed1K() {
  await connectDB();

  console.log('Clearing existing database collections...');
  await Promise.all([
    Customer.deleteMany({}),
    Gallon.deleteMany({}),
    Transaction.deleteMany({}),
    Admin.deleteMany({})
  ]);

  console.log('Creating default admin user...');
  await Admin.create({ username: 'admin', password: 'admin123' });

  console.log('Generating 1,000 sample customer profiles...');
  const customerDocs = [];
  const generatedNames = new Set();

  for (let i = 0; i < 1000; i++) {
    let fn = getRandomItem(FIRST_NAMES);
    let ln = getRandomItem(LAST_NAMES);
    let fullName = `${fn} ${ln}`;
    
    // Ensure uniqueness or add middle initial if duplicate
    if (generatedNames.has(fullName)) {
      const middleChar = String.fromCharCode(65 + (i % 26));
      fullName = `${fn} ${middleChar}. ${ln}`;
    }
    generatedNames.add(fullName);

    customerDocs.push({
      name: fullName,
      phone: getRandomPhone(),
      address: `${getRandomItem(STREETS)}, ${getRandomItem(LOCATIONS)}`,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))
    });
  }

  const createdCustomers = await Customer.insertMany(customerDocs);
  console.log(`Successfully created ${createdCustomers.length} customers!`);

  console.log('Generating ~1,200 sample gallon records...');
  const gallonDocs = [];
  const sizes = ['Round', 'Slim', 'Custom (5L)'];
  const deliveryStatuses = ['delivered', 'undelivered'];
  const paymentStatuses = ['paid', 'unpaid'];

  // Generate 1,200 gallons
  for (let i = 0; i < 1200; i++) {
    // 85% of gallons belong to a customer, 15% are unassigned stock
    const customer = Math.random() > 0.15 ? getRandomItem(createdCustomers) : null;
    const delivery = getRandomItem(deliveryStatuses);
    const payment = getRandomItem(paymentStatuses);
    // Location logic: if delivered, it's with customer; if undelivered, 70% chance at station
    const location = delivery === 'delivered' ? 'with_customer' : (Math.random() > 0.3 ? 'at_station' : 'with_customer');

    gallonDocs.push({
      qrCode: generateGallonCode(),
      customer: customer ? customer._id : null,
      size: getRandomItem(sizes),
      price: 30,
      deliveryStatus: delivery,
      paymentStatus: payment,
      locationStatus: location,
      lastScannedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000))
    });
  }

  const createdGallons = await Gallon.insertMany(gallonDocs);
  console.log(`Successfully created ${createdGallons.length} gallons!`);

  console.log('Creating initial audit transaction logs...');
  const txDocs = createdGallons.slice(0, 500).map((g) => ({
    gallon: g._id,
    customer: g.customer,
    action: 'registered',
    note: 'Bulk seeded gallon record.',
    createdAt: g.createdAt
  }));
  await Transaction.insertMany(txDocs);

  console.log('\n==========================================');
  console.log('1,000 Sample Dataset Seeding Complete! 🚀');
  console.log(` - Admin Login: admin / admin123`);
  console.log(` - Total Customers: ${createdCustomers.length}`);
  console.log(` - Total Gallons:   ${createdGallons.length}`);
  console.log('==========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed1K().catch((err) => {
  console.error('Failed to seed 1k data:', err);
  process.exit(1);
});
