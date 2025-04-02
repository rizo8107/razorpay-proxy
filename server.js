const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`[ERROR] Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('[ERROR] Please ensure all required environment variables are set in your .env file or environment');
  process.exit(1);
}

console.log('[INFO] Environment variables validated successfully');
console.log(`[INFO] ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS || '*'}`);
console.log(`[INFO] API_KEY: ${process.env.API_KEY.substring(0, 8)}...`);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Key Authentication Middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  console.log(`[AUTH] Received API key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'undefined'}`);
  console.log(`[AUTH] Expected API key: ${process.env.API_KEY ? process.env.API_KEY.substring(0, 8) + '...' : 'undefined'}`);
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    console.error(`[AUTH] Authentication failed: API key mismatch or missing`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log(`[AUTH] Authentication successful`);
  next();
};

// Razorpay API Base URL
const RAZORPAY_API = 'https://api.razorpay.com/v1';

// Create Razorpay order
app.post('/api/orders', authenticateApiKey, async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    
    // Prepare request body with required parameters
    const requestBody = {
      amount,
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
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

// Keep legacy endpoint for backward compatibility
app.post('/create-order', authenticateApiKey, async (req, res) => {
  // Redirect to the new API endpoint
  req.url = '/api/orders';
  app._router.handle(req, res);
});

// Get order details
app.get('/api/orders/:orderId', authenticateApiKey, async (req, res) => {
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

// Keep legacy endpoint for backward compatibility
app.get('/orders/:orderId', authenticateApiKey, async (req, res) => {
  // Redirect to the new API endpoint
  req.url = `/api/orders/${req.params.orderId}`;
  app._router.handle(req, res);
});

// List orders
app.get('/api/orders', authenticateApiKey, async (req, res) => {
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

// Keep legacy endpoint for backward compatibility
app.get('/orders', authenticateApiKey, async (req, res) => {
  // Redirect to the new API endpoint
  req.url = '/api/orders';
  app._router.handle(req, res);
});

// Verify payment
app.post('/api/payments/verify', authenticateApiKey, async (req, res) => {
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

// Keep legacy endpoint for backward compatibility
app.post('/verify-payment', authenticateApiKey, async (req, res) => {
  // Redirect to the new API endpoint
  req.url = '/api/payments/verify';
  app._router.handle(req, res);
});

// Capture payment
app.post('/api/payments/capture', authenticateApiKey, async (req, res) => {
  try {
    const { payment_id, amount } = req.body;
    
    console.log(`[CAPTURE] Processing payment capture request:`, { payment_id, amount });
    
    if (!payment_id) {
      console.error(`[CAPTURE] Missing payment_id in request`);
      return res.status(400).json({ error: 'payment_id is required' });
    }
    
    const requestBody = {};
    if (amount) {
      requestBody.amount = amount;
    }
    
    console.log(`[CAPTURE] Capturing payment ${payment_id}${amount ? ` for amount ${amount}` : ''}`);
    
    try {
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
      
      console.log(`[CAPTURE] Payment captured successfully:`, response.data.status);
      res.json(response.data);
    } catch (razorpayError) {
      console.error(`[CAPTURE] Razorpay API error:`, razorpayError.response?.data || razorpayError.message);
      
      // Provide more specific error message based on Razorpay's response
      const errorDetail = razorpayError.response?.data?.error?.description || 
                          razorpayError.response?.data?.error ||
                          razorpayError.message || 
                          'Unknown error occurred during payment capture';
      
      res.status(razorpayError.response?.status || 500).json({
        error: errorDetail,
        code: razorpayError.response?.data?.error?.code
      });
    }
  } catch (error) {
    console.error(`[CAPTURE] Unexpected error:`, error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Keep legacy endpoint for backward compatibility
app.post('/capture-payment', authenticateApiKey, async (req, res) => {
  console.log(`[LEGACY] Received request to /capture-payment, redirecting to /api/payments/capture`);
  // Redirect to the new API endpoint
  req.url = '/api/payments/capture';
  app._router.handle(req, res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API version endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Razorpay Proxy API',
    version: '1.0.0',
    endpoints: {
      orders: '/api/orders',
      verifyPayment: '/api/payments/verify',
      capturePayment: '/api/payments/capture',
      health: '/health'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Razorpay proxy server running on port ${PORT}`);
}); 