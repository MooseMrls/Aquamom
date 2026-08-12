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
const transactionRoutes = require('./routes/transactionRoutes');
const walkInRoutes = require('./routes/walkInRoutes');

const app = express();

// Accept a comma-separated list in CLIENT_URL (e.g. "https://aquamomstation.vercel.app,http://localhost:5173")
// and always allow localhost so local dev never gets silently blocked by a
// production-only CORS setting.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalhost = !origin || /^https?:\/\/localhost(:\d+)?$/.test(origin);
      if (allowedOrigins.length === 0 || isLocalhost || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Aquamom API' }));

// Public auth routes
app.use('/api/auth', authRoutes);

// Protected admin routes
app.get('/api/dashboard', requireAuth, getDashboardStats);
app.use('/api/customers', customerRoutes);
app.use('/api/gallons', requireAuth, gallonRoutes);
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/walkins', requireAuth, walkInRoutes);

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