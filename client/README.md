# Save Gaza - Donation Management Platform

A private platform for a small group of 10 authorized members to manage donation data, including donors, donations, and campaigns. Built with the MERN stack (MongoDB, Express.js, React, and Node.js).

## Overview

Save Gaza is a data management application designed exclusively for a private group of 10 users to:

- **Manage donor information** and track donations (both cash and goods)
- **Organize campaigns** with goals, descriptions, and attachments
- **Track donation progress** and view aggregate statistics
- **Secure sensitive data** behind authentication with uniform member permissions

The application is **not** for processing donations directly but for managing data of those who have already donated.

## Features

- **Authentication**: Secure JWT-based login for authorized members
- **Dashboard**: Overview of donation statistics, active campaigns, and recent donations
- **Donations Management**: Create, read, update, delete donor information and donations
- **Campaign Management**: Organize donations into campaigns with goals, status tracking, and file attachments
- **User Management**: Add, edit and delete authorized members (all with the same 'member' role)
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Tech Stack

- **Frontend**: React 18+ with React Router, React Hook Form
- **UI Framework**: Tailwind CSS with @tailwindcss/forms for styling
- **State Management**: React Context API for auth and application state
- **HTTP Client**: Axios for API communication
- **File Uploads**: react-dropzone for campaign attachments

## Setup Instructions

### Prerequisites

- Node.js 16.x or higher
- MongoDB database (local or cloud-hosted via MongoDB Atlas)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-repo/save-gaza.git
cd save-gaza
```

2. Install dependencies for both client and server:

```bash
# Install client dependencies
cd client
npm install

# Return to root and install server dependencies
cd ../server
npm install
```

3. Create environment variables:

In the client directory, create a `.env` file:

```
REACT_APP_API_URL=http://localhost:5000/api
```

In the server directory, create a `.env` file:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/save-gaza
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d
```

4. Start the development servers:

For the server:

```bash
cd server
npm run dev
```

For the client:

```bash
cd client
npm start
```

5. Access the application at `http://localhost:3000`

### Resolving Dependency Issues

This project specifically uses `typescript@4.9.5` for compatibility with `react-scripts@5.0.1`. If you encounter dependency conflicts:

1. Clear npm cache:

```bash
npm cache clean --force
```

2. Delete node_modules and reinstall:

```bash
rm -rf node_modules
npm install
```

3. If issues persist with TypeScript versioning, use the resolutions field in package.json:

```json
"resolutions": {
  "typescript": "4.9.5"
}
```

4. If using Yarn, run:

```bash
yarn install
```

## Backend API Endpoints

The application uses a RESTful API with the following endpoints:

- **Authentication**:

  - POST `/api/auth/login` - User login
  - POST `/api/auth/register` - Register new user (only accessible to authenticated members)
  - GET `/api/auth/me` - Get current user information

- **Users**:

  - GET `/api/users` - List all users
  - GET `/api/users/:id` - Get specific user
  - POST `/api/users` - Create a new user
  - PUT `/api/users/:id` - Update a user
  - DELETE `/api/users/:id` - Delete a user

- **Donations**:

  - GET `/api/donations` - List all donations (with optional filters)
  - GET `/api/donations/:id` - Get specific donation
  - POST `/api/donations` - Create a new donation
  - PUT `/api/donations/:id` - Update a donation
  - DELETE `/api/donations/:id` - Delete a donation

- **Campaigns**:
  - GET `/api/campaign` - List all campaigns (with optional filters)
  - GET `/api/campaign/:id` - Get specific campaign
  - POST `/api/campaign` - Create a new campaign (with support for file attachments)
  - PUT `/api/campaign/:id` - Update a campaign
  - DELETE `/api/campaign/:id` - Delete a campaign

## User Permissions

All authenticated users have the same role ('member') with full permissions to:

- Create, read, update, and delete all data across the system
- Manage other users (except deleting their own account)
- Upload and delete files for campaign attachments

## Schema Structure

### Users

```
- id: MongoDB ObjectId
- username: String (required, unique)
- password_hash: String (required, securely hashed)
- email: String (required, unique)
- role: String (fixed as 'member')
- created_at: Date
```

### Donations

```
- id: MongoDB ObjectId
- donor_name: String (optional)
- donation_type: String (either 'cash' or 'goods')
- amount: Number (optional)
- description: String (optional)
- received_by: ObjectId (references user who recorded donation)
- date_received: Date
- campaign_id: ObjectId (optional, references campaign)
```

### Campaigns

```
- id: MongoDB ObjectId
- title: String (required)
- description: String (required)
- start_date: Date (required)
- end_date: Date (optional)
- created_by: ObjectId (references user who created campaign)
- goal_amount: Number (required)
- status: String (either 'active' or 'completed')
- attachments: Array of file paths/URLs
```

## License

This project is proprietary and for private use only.

## Contact

For support or inquiries, please contact the project maintainer.
