const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', database: 'Ready' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
