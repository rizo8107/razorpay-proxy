# Easy Panel Deployment Guide for Razorpay Proxy Server

This guide will walk you through deploying the Razorpay Proxy Server on Easy Panel.

## Step 1: Prepare Your Project

Ensure your project has all the necessary files:
- `package.json` with correct dependencies and scripts
- `server.js` (main application file)
- `.env.example` (template for environment variables)
- `.gitignore` (to exclude sensitive files)

## Step 2: Log in to Easy Panel

1. Navigate to [Easy Panel](https://easypanel.io/) (or your custom Easy Panel URL)
2. Log in with your credentials

## Step 3: Create a New Project

1. Click on "Projects" in the sidebar
2. Click "Create Project" or "+" button
3. Give your project a name (e.g., "razorpay-proxy")
4. Choose a suitable template (Node.js)

## Step 4: Configure Your Project

1. Select "Git Repository" as the deployment method
2. Enter your Git repository URL
3. Set the branch (usually "main" or "master")
4. Configure build settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Port: `3000` (or the port you configured)

## Step 5: Configure Environment Variables

1. Navigate to the "Environment" tab
2. Add the following environment variables:
   - `PORT=3000`
   - `RAZORPAY_KEY_ID=your_razorpay_key_id`
   - `RAZORPAY_KEY_SECRET=your_razorpay_key_secret`
   - `API_KEY=your_secure_api_key_for_proxy_auth`
   - `ALLOWED_ORIGINS=https://yourdomain.com,https://anotherdomain.com`

## Step 6: Deploy Your Application

1. Click "Deploy" or "Save and Deploy"
2. Monitor the deployment logs to ensure everything is working correctly

## Step 7: Configure Domain (Optional)

1. Go to the "Domain" tab
2. Add your custom domain or use the provided subdomain
3. Configure SSL if necessary

## Step 8: Test Your Deployment

Test your endpoints:
- Health check: `GET https://your-domain.com/health`
- Create order: `POST https://your-domain.com/create-order` (with appropriate headers and body)

Remember to include the `X-API-Key` header with the value matching your `API_KEY` environment variable in all API requests.

## Step 9: Monitoring and Logs

1. Use the "Logs" tab to view application logs
2. Monitor application performance in the "Metrics" tab

## Troubleshooting

If your deployment fails:

1. Check the logs for error messages
2. Verify that all environment variables are set correctly
3. Ensure the port setting matches what your application is using
4. Check that your Git repository is accessible
5. Verify that your package.json has the correct dependencies and scripts

## Updating Your Application

1. Push changes to your Git repository
2. In Easy Panel, navigate to your project
3. Click "Deploy" to deploy the latest changes 