## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecomrepo
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Variables**

   Create a `.env` file in the `backend` directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your-secret-key-here
   GEMINI_API_KEY=your-gemini-api-key
   PORT=5000
   NODE_ENV=development
   
   # Email Configuration (for OTP functionality)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```
   
   **Note for Gmail users**: You need to generate an App Password:
   1. Go to your Google Account settings
   2. Enable 2-Step Verification
   3. Go to App Passwords and generate one for "Mail"
   4. Use that App Password as `EMAIL_PASSWORD`

### Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev    # Development mode with nodemon
   # or
   npm start      # Production mode
   ```
   Backend will run on `http://localhost:5000`

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on `http://localhost:3000`

## 🏗️ Architecture Overview

### Backend Architecture

The backend follows a **MVC (Model-View-Controller)** pattern with clear separation of concerns:

- **Models**: Define database schemas using Mongoose
- **Controllers**: Handle business logic and request processing
- **Routes**: Define API endpoints and map them to controllers
- **Middleware**: Handle authentication, validation, etc.
- **Config**: Database and service configurations
- **Utils**: Reusable utility functions

### Frontend Architecture

The frontend uses **React** with:
- **React Router**: Client-side routing
- **Component-based**: Reusable UI components
- **Context API**: State management (if used)
- **Tailwind CSS**: Utility-first CSS framework

## 🔄 Application Workflow

### User Flow

1. **Homepage** (`/`)
   - Guest users see product catalog
   - Authenticated users see personalized dashboard

2. **Authentication**
   - **Signup** (`/signup`): Create new user account with email OTP verification
   - **Login** (`/login`): User authentication with show/hide password
   - **Forgot Password** (`/forgot-password`): Reset password with OTP verification
   - **Admin Login** (`/adminlogin`): Admin authentication

3. **Product Browsing**
   - Browse all products on main page
   - Filter by category (`/category/:name`)
   - View product details (`/product/:id`)
   - Add products to cart

4. **Shopping Cart** (`/usercart`)
   - View cart items
   - Update quantities
   - Remove items
   - Proceed to checkout

5. **Checkout** (`/checkout`)
   - Enter delivery address
   - Select payment method
   - Place order

6. **Order Management** (`/myorders`)
   - View order history
   - Track order status
   - Request returns (`/return-order/:orderId`)

### Admin Flow

1. **Admin Dashboard** (`/adminmain`)
   - View statistics (products, orders, returns)
   - Manage products (upload, edit, delete)
   - Manage orders (accept, reject, assign delivery)
   - Handle return requests
   - Verify payments
   - Configure return policy
## 🔐 Authentication & Authorization

### JWT Token-Based Authentication
- Tokens are stored in HTTP-only cookies
- Token expires after 7 days
- Middleware `isLoggedIn` verifies tokens on protected routes

### User Roles
- **Regular User**: Can browse, add to cart, place orders
- **Admin User**: Full access to admin dashboard and management features

## 🗄️ Database Schema

### User Model
- `name`, `email`, `password` (hashed)
- `isAdmin` (boolean)
- `cart[]` (array of cart items)
- `orders[]` (array of order references)

### OTP Model
- `email` - User email address
- `otp` - 6-digit OTP code
- `purpose` - "signup" or "forgot-password"
- `expiresAt` - OTP expiration timestamp (10 minutes)
- `verified` - Verification status

### Product Model
- `name`, `description`, `price`
- `image` (Buffer), `images[]` (array of Buffers)
- `category`, `isPopular`
- `sizes[]` (array of size objects)
- `reviews[]` (array of review objects)

### Order Model
- `productId`, `userId` (references)
- `quantity`, `size`
- `status` (Pending, Accepted, Rejected, Assigned, Delivered)
- `deliveryAddress`, `deliveryPhone`
- `deliveryPartnerName`, `deliveryPartnerPhone`, `trackingId`
- `estimatedDelivery`, `deliveredDate`
- `returnStatus` (None, Requested, Approved, Rejected, Completed)
- `returnReason`, `returnRequestDate`, `returnApprovedDate`
- `paymentType`, `paymentMethod`, `paymentStatus`
- `paymentId`, `paymentVerified`, `paymentAmount`

## 🛠️ Key Features

### User Features
- ✅ User registration with email OTP verification
- ✅ User authentication with show/hide password
- ✅ Forgot password with OTP verification
- ✅ Product browsing and search
- ✅ Category filtering
- ✅ Shopping cart management
- ✅ Order placement and tracking
- ✅ Order return requests
- ✅ Product reviews and ratings
- ✅ AI-powered shopping assistant chatbot

### Admin Features
- ✅ Admin dashboard with statistics
- ✅ Product management (CRUD operations)
- ✅ Order management and status updates
- ✅ Delivery partner assignment
- ✅ Return request handling
- ✅ Payment verification
- ✅ Return policy configuration

## 🔧 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email service for OTP
- **Google Gemini AI** - Chatbot integration

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **React Toastify** - Notifications
- **Lucide React** - Icons

## 📝 Development Guidelines

### Code Organization
- **Controllers**: Handle request/response logic
- **Routes**: Define API endpoints
- **Middleware**: Reusable request handlers
- **Models**: Database schemas
- **Utils**: Helper functions

### Best Practices
- Use async/await for asynchronous operations
- Implement proper error handling
- Validate input data
- Use environment variables for sensitive data
- Follow RESTful API conventions
- Keep components modular and reusable

## 🚢 Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in `.env`
2. Update `MONGO_URI` to production database
3. Build and deploy to hosting service (Heroku, AWS, etc.)

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Deploy `build/` folder to static hosting (Netlify, Vercel, etc.)
3. Update API endpoints in frontend if needed
