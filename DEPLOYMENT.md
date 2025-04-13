# Deployment Guide for SupportGaza App

## Deployment Options

This application can be deployed in several ways. Here are the recommended approaches:

### Option 1: Render.com (Recommended)

1. Sign up for a [Render.com](https://render.com) account
2. Connect your GitHub repository
3. Use the `render.yaml` file in the project to automatically create both services:
   - Backend API (Node.js)
   - Frontend App (Static site)
4. Set up environment variables in the Render dashboard for each service:
   - For the API: `MONGODB_URI`, `JWT_SECRET`, etc.
   - For the frontend: `REACT_APP_API_URL`

### Option 2: Manual Deployment

#### Backend (Server)

1. Deploy to any Node.js hosting service (Heroku, DigitalOcean, AWS, etc.)
2. Set the following environment variables:
   - `PORT`: Port for the server to run on
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT authentication
   - `CORS_ORIGIN`: URL of your frontend application
   - `NODE_ENV`: Set to "production"
3. Run `npm install` and `npm start`

#### Frontend (Client)

1. Build the React app with `npm run build`
2. Deploy the contents of the `build` folder to any static hosting service:
   - Netlify
   - Vercel
   - GitHub Pages
   - AWS S3 + CloudFront
3. Set the `REACT_APP_API_URL` environment variable to point to your backend API

## Database Setup

Ensure your MongoDB Atlas cluster is properly configured:

1. Set up network access to allow connections from anywhere (or specific IPs)
2. Create a database user with appropriate permissions
3. Copy the connection string and update it in your environment variables

## Custom Domain Setup (Optional)

To use custom domains:

1. Purchase a domain from a domain registrar
2. Configure DNS settings to point to your deployed applications
3. Update the `CORS_ORIGIN` on the backend
4. Update the `REACT_APP_API_URL` on the frontend

## CI/CD Setup (Optional)

For continuous integration and deployment:

1. Set up GitHub Actions or another CI/CD service
2. Configure automatic deployments on code changes
3. Include environment variables in your CI/CD pipeline
