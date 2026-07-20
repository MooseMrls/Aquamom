require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { getDashboardStats } = require('./controllers/gallonController');
const requireAuth = require('./middleware/auth');

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const gallonRoutes = require('./routes/gallonRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Aquamom API' }));

// Public auth routes
app.use('/api/auth', authRoutes);

// Protected admin routes
app.get('/api/dashboard', requireAuth, getDashboardStats);
app.use('/api/customers', requireAuth, customerRoutes);
app.use('/api/gallons', requireAuth, gallonRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Aquamom API running on port ${PORT}`));
});
