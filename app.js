import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import bodyparser from 'body-parser'

// Import routes

import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import contactRoutes from './routes/contacts.js'
import transactionRoutes from './routes/transactions.js'
import reportRoutes from './routes/reports.js'

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyparser.urlencoded({ extended: true }))


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api', contactRoutes);
app.use('/api', transactionRoutes);
app.use('/api', reportRoutes);

// Home page 
app.get('/', (req, res) => {
  res.json({ message: 'Inventory & Billing Management System API is running!' })
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});