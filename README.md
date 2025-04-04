# Razorpay Proxy Server

A secure proxy server for handling Razorpay API requests, ensuring payment processing works correctly while keeping your API keys secure.

## Features

- Securely handles Razorpay API requests
- Follows Razorpay's official API documentation
- Keeps your Razorpay API keys secure on the server
- Provides comprehensive Order API integration
- Includes payment verification and capture endpoints
- Includes API key authentication for added security

## Setup Instructions

1. Clone this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and update the values with your Razorpay credentials
4. Start the server: `npm start` (or `npm run dev` for development with auto-reload)

## Environment Variables

- `PORT`: The port the server will run on (default: 3000)
- `RAZORPAY_KEY_ID`: Your Razorpay Key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret
- `API_KEY`: A secure API key of your choice to authenticate requests to this proxy
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS

## Auto-Capture Configuration

Auto-capture of payments is controlled by your Razorpay dashboard settings, not in the API calls. To enable auto-capture:

1. Log in to your Razorpay dashboard
2. Go to Settings > Payment Capture > Auto Capture
3. Set "Auto Capture" to "ON"

For more information, refer to [Razorpay's documentation on payment capture](https://razorpay.com/docs/payments/payments/capture-settings/).

## Deploying to Easy Panel

### Prerequisites

- An Easy Panel account
- Node.js project with valid package.json

### Deployment Steps

1. Log in to your Easy Panel account
2. Create a new application
3. Select Node.js as the application type
4. Connect your repository or upload the code
5. Set up the following configuration:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Node.js Version: Select latest LTS version
6. Configure environment variables (PORT, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, API_KEY, ALLOWED_ORIGINS)
7. Deploy the application

## API Endpoints

Include the `X-API-Key` header with your API key for all requests.

### API Information
- `GET /api`: Get API information and available endpoints

### Order Management
- `POST /api/orders`: Create a new Razorpay order
  - Body: `{ "amount": 50000, "currency": "INR", "receipt": "receipt_123", "notes": {} }`
- `GET /api/orders/:orderId`: Get details of a specific order
- `GET /api/orders`: List all orders
  - Query params: `from`, `to`, `count`, `skip`

### Payment Operations
- `POST /api/payments/verify`: Verify a payment signature
  - Body: `{ "payment_id": "pay_123", "order_id": "order_123", "signature": "generated_signature" }`
- `POST /api/payments/capture`: Manually capture a payment (if auto-capture is OFF)
  - Body: `{ "payment_id": "pay_123", "amount": 50000 }`

### Monitoring
- `GET /health`: Check if the server is running

### Legacy Endpoints
The following legacy endpoints are maintained for backward compatibility:
- `POST /create-order` → redirects to `/api/orders`
- `GET /orders/:orderId` → redirects to `/api/orders/:orderId`
- `GET /orders` → redirects to `/api/orders`
- `POST /verify-payment` → redirects to `/api/payments/verify`
- `POST /capture-payment` → redirects to `/api/payments/capture`

## Security Considerations

- Always use HTTPS for your proxy server
- Regularly rotate your API keys
- Set up proper CORS to only allow requests from your domains
- Consider implementing rate limiting to prevent abuse 