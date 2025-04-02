const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// API Key Authentication Middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Razorpay API Base URL
const RAZORPAY_API = 'https://api.razorpay.com/v1';

// Create Razorpay order
app.post('/create-order', authenticateApiKey, async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    
    // Ensure payment_capture is set to 1
    const requestBody = {
      amount,
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Force payment_capture to 1
      notes: notes || {}
    };
    
    console.log('Creating order with:', requestBody);
    
    const response = await axios.post(`${RAZORPAY_API}/orders`, requestBody, {
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET
      }
    });
    
    console.log('Order created successfully:', response.data.id);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating order:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Get order details
app.get('/orders/:orderId', authenticateApiKey, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log(`Fetching details for order: ${orderId}`);
    
    const response = await axios.get(`${RAZORPAY_API}/orders/${orderId}`, {
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET
      }
    });
    
    console.log('Order details fetched successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching order details:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// List orders
app.get('/orders', authenticateApiKey, async (req, res) => {
  try {
    // Extract query parameters
    const { from, to, count, skip } = req.query;
    
    // Construct query parameters
    const queryParams = new URLSearchParams();
    if (from) queryParams.append('from', from);
    if (to) queryParams.append('to', to);
    if (count) queryParams.append('count', count);
    if (skip) queryParams.append('skip', skip);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    console.log(`Listing orders with params: ${queryString || 'none'}`);
    
    const response = await axios.get(`${RAZORPAY_API}/orders${queryString}`, {
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET
      }
    });
    
    console.log(`Listed ${response.data.count} orders`);
    res.json(response.data);
  } catch (error) {
    console.error('Error listing orders:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Verify payment
app.post('/verify-payment', authenticateApiKey, async (req, res) => {
  try {
    const { payment_id, order_id, signature } = req.body;
    
    // Verify signature
    const text = order_id + '|' + payment_id;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');
    
    if (generatedSignature !== signature) {
      console.log('Signature verification failed');
      return res.json({
        verified: false,
        error: 'Invalid signature'
      });
    }
    
    // Get payment status from Razorpay
    const payment = await axios.get(`${RAZORPAY_API}/payments/${payment_id}`, {
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET
      }
    });
    
    console.log('Payment verified, status:', payment.data.status);
    
    res.json({
      verified: true,
      status: payment.data.status,
      payment: payment.data
    });
  } catch (error) {
    console.error('Error verifying payment:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      verified: false,
      error: error.response?.data || error.message
    });
  }
});

// Capture payment
app.post('/capture-payment', authenticateApiKey, async (req, res) => {
  try {
    const { payment_id, amount } = req.body;
    
    if (!payment_id) {
      return res.status(400).json({ error: 'payment_id is required' });
    }
    
    const requestBody = {};
    if (amount) {
      requestBody.amount = amount;
    }
    
    console.log(`Capturing payment ${payment_id}${amount ? ` for amount ${amount}` : ''}`);
    
    const response = await axios.post(
      `${RAZORPAY_API}/payments/${payment_id}/capture`, 
      requestBody,
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET
        }
      }
    );
    
    console.log('Payment captured successfully:', response.data.status);
    res.json(response.data);
  } catch (error) {
    console.error('Error capturing payment:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Razorpay proxy server running on port ${PORT}`);
}); 