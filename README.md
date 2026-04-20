# The Wishing Lake of Smiles - Complete MERN Stack

A production-ready full-stack web application where dreams meet kindness. Users can toss wishes, fulfill others' wishes, make secure payments, and build meaningful connections.

## 🌊 Features

✅ **User Authentication** - Secure JWT-based auth with email/password  
✅ **Wish Management** - Create, browse, filter, and save wishes  
✅ **Fulfillment System** - Request, approve, and fulfill wishes  
✅ **Payment Gateway** - Razorpay (India) & Stripe (Global)  
✅ **Notifications** - Real-time updates on wish activities  
✅ **Admin Dashboard** - Manage users, wishes, payments, analytics  
✅ **Responsive UI** - Mobile, tablet, desktop with Framer Motion animations  
✅ **Security** - Helmet, CORS, rate limiting, JWT tokens  

---

## 📋 Tech Stack

### Frontend
- **React 19** - UI Library  
- **Vite** - Build tool  
- **Tailwind CSS v4** - Styling  
- **Framer Motion** - Animations  
- **React Router v6** - Routing  
- **Axios** - HTTP client  
- **React Hook Form** - Form handling  
- **Zustand** - State management (optional)  
- **React Hot Toast** - Notifications  

### Backend
- **Node.js** - Runtime  
- **Express.js** - Web framework  
- **MongoDB** - Database  
- **Mongoose** - ODM  
- **JWT** - Authentication  
- **Bcrypt** - Password hashing  
- **Razorpay & Stripe** - Payments  
- **Socket.io** - Real-time (optional)  
- **Nodemailer** - Email (optional)  

### Deployment
- **Frontend** - Vercel  
- **Backend** - Render  
- **Database** - MongoDB Atlas  

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- Git
- API keys for Razorpay/Stripe (optional for testing)

### 1. Clone & Setup Backend

```bash
cd backend
npm install
```

**Create `.env` file:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/wishing-lake
JWT_SECRET=your_jwt_secret_change_in_production
JWT_EXPIRE=7d

# Razorpay
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

FRONTEND_URL=http://localhost:5173
```

**Start Backend:**
```bash
npm run dev
```

Server runs on `http://localhost:5000`

---

### 2. Clone & Setup Frontend

```bash
cd Fontend
npm install
```

**Create `.env` file:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

**Start Frontend:**
```bash
npm run dev
```

App runs on `http://localhost:5173`

---

## 📁 Project Structure

```
Dream-Project/
├── backend/
│   ├── models/           # Mongoose schemas
│   │   ├── User.js
│   │   ├── Wish.js
│   │   ├── Payment.js
│   │   ├── FulfillmentRequest.js
│   │   └── Notification.js
│   ├── controllers/      # Business logic
│   │   ├── authController.js
│   │   ├── wishController.js
│   │   ├── paymentController.js
│   │   ├── userController.js
│   │   └── adminController.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── wishRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── userRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/      # Auth, error handling
│   │   └── authMiddleware.js
│   ├── config/          # Database config
│   │   └── database.js
│   ├── server.js        # Express app
│   ├── package.json
│   └── .env.example
│
└── Fontend/
    ├── src/
    │   ├── components/   # Reusable components
    │   │   ├── Navbar.jsx
    │   │   ├── Loading.jsx
    │   │   └── ...
    │   ├── pages/       # Page components
    │   │   ├── LandingPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegistrationPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── TossWishPage.jsx
    │   │   ├── FulfillWishPage.jsx
    │   │   └── MyWishesPage.jsx
    │   ├── context/     # Auth context
    │   │   └── authContext.jsx
    │   ├── hooks/       # Custom hooks
    │   │   └── useAuth.js
    │   ├── services/    # API calls
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── public/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── .env.example
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          - Register user
POST   /api/auth/login             - Login user
POST   /api/auth/logout            - Logout
GET    /api/auth/me                - Get current user
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password/:token - Reset password
```

### Wishes
```
GET    /api/wishes                 - Get all public wishes
GET    /api/wishes/:id             - Get single wish
POST   /api/wishes                 - Create wish
PUT    /api/wishes/:id             - Update wish
DELETE /api/wishes/:id             - Delete wish
POST   /api/wishes/:id/fulfill-request - Request fulfillment
POST   /api/wishes/:id/like        - Like a wish
POST   /api/wishes/:id/save        - Save wish for later
GET    /api/wishes/user/my-wishes  - Get user's wishes
GET    /api/wishes/user/fulfilling - Get wishes user is fulfilling
GET    /api/wishes/user/saved      - Get saved wishes
```

### Payments
```
POST   /api/payment/create-razorpay-order - Create Razorpay order
POST   /api/payment/verify-razorpay       - Verify payment
POST   /api/payment/create-stripe-intent  - Create Stripe intent
POST   /api/payment/confirm-stripe        - Confirm Stripe payment
GET    /api/payment/history               - Payment history
POST   /api/payment/webhook/razorpay      - Razorpay webhook
POST   /api/payment/webhook/stripe        - Stripe webhook
```

### User
```
GET    /api/user/profile          - Get user profile
PUT    /api/user/profile          - Update profile
POST   /api/user/change-password  - Change password
GET    /api/user/notifications   - Get notifications
PUT    /api/user/notifications/:id/read - Mark as read
GET    /api/user/fulfillment-requests - Get fulfillment requests
POST   /api/user/fulfillment-requests/:id/consent - Give consent
POST   /api/user/fulfillment-requests/:id/rate - Rate fulfillment
GET    /api/user/stats            - User statistics
```

### Admin
```
GET    /api/admin/users                   - All users
PUT    /api/admin/users/:id/block        - Block/unblock user
GET    /api/admin/wishes                 - All wishes
GET    /api/admin/wishes/:id             - Wish details
GET    /api/admin/fulfillment-requests   - All requests
PUT    /api/admin/fulfillment-requests/:id/approve   - Approve
PUT    /api/admin/fulfillment-requests/:id/reject    - Reject
GET    /api/admin/analytics              - Platform analytics
```

---

## 🔐 Security Features

- ✅ JWT authentication with expiration
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ HTTP-only cookies support
- ✅ CORS configured per environment
- ✅ Rate limiting (100 requests/15 minutes)
- ✅ Helmet security headers
- ✅ Input validation with Mongoose schemas
- ✅ SQL/NoSQL injection prevention
- ✅ CSRF protection ready

---

## 📊 Database Models

### User
```javascript
{
  name, email, password (hashed),
  role: 'user' | 'admin',
  wishesMade: [Wish._id],
  wishesFulfilled: [Wish._id],
  savedWishes: [Wish._id],
  isActive: boolean,
  avatar: string,
  stats: { totalWishesMade, totalWishesFulfilled, averageRating, totalRatings },
  badges: [string],
  timestamps
}
```

### Wish
```javascript
{
  wisherId: User._id,
  title, description,
  category: 'Material' | 'Message Delivery' | 'Creative Gift' | 'Custom Idea' | 'Experience' | 'Knowledge' | 'Help',
  budget: number,
  currency: 'INR' | 'USD' | 'EUR',
  image: string,
  isPublic: boolean,
  status: 'Pending' | 'Accepted' | 'Fulfilled' | 'Cancelled',
  fulfillerId: User._id,
  isAnonymous: boolean,
  views, likes: [User._id],
  comments: [],
  timestamps
}
```

### Payment
```javascript
{
  userId: User._id,
  wishId: Wish._id,
  orderId, paymentId, signature,
  amount, currency,
  status: 'Created' | 'Pending' | 'Paid' | 'Failed' | 'Refunded',
  gateway: 'Razorpay' | 'Stripe',
  receiptId, failureReason,
  metadata: {},
  timestamps
}
```

### FulfillmentRequest
```javascript
{
  wishId: Wish._id,
  wisherId, fulfillerId: User._id,
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed',
  message: string,
  wisherConsent, fulfillerConsent: boolean,
  identitiesRevealed: boolean,
  rating: {
    byWisher: { score, review, createdAt },
    byFulfiller: { score, review, createdAt }
  },
  paymentId: Payment._id,
  timestamps
}
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Run tests
npm run test:watch        # Watch mode
```

### Frontend Tests
```bash
cd Fontend
npm test                    # Run tests
npm run test:ui            # UI mode
```

---

## 🚀 Deployment

### Deploy Backend to Render

1. Push code to GitHub
2. Create account at `render.com`
3. Create new Web Service
4. Connect GitHub repo
5. Set environment variables
6. Deploy

**Environment variables for production:**
```
NODE_ENV=production
MONGODB_URI=<your-mongodb-atlas-url>
JWT_SECRET=<generate-strong-secret>
FRONTEND_URL=https://your-domain.vercel.app
RAZORPAY_KEY_ID=<production-key>
RAZORPAY_KEY_SECRET=<production-secret>
```

### Deploy Frontend to Vercel

1. Push code to GitHub
2. Go to `vercel.com`
3. Import project
4. Set environment variables
5. Deploy

**Environment variables:**
```
VITE_API_URL=https://your-api.onrender.com/api
VITE_RAZORPAY_KEY_ID=<your-key>
VITE_STRIPE_PUBLIC_KEY=<your-key>
```

### Deploy Database to MongoDB Atlas

1. Create cluster at `mongodb.com/atlas`
2. Create database user
3. Whitelist IPs
4. Copy connection string
5. Add to backend `.env`

---

## 📱 Features Breakdown

### Landing Page
- Hero section with animated lake background
- Feature highlights
- CTA buttons for "Toss a Wish" and "Fulfill a Wish"
- Responsive design

### Authentication
- Email/password signup
- Secure login
- Password reset (email-based)
- Protected routes

### Dashboard
- User statistics (wishes made, fulfilled, pending)
- Quick action buttons
- Recent activity
- User profile edit

### Wish Management
- Create wish with category, budget, description
- Browse public wishes with filters
- Save wishes for later
- Like wishes
- Request fulfillment

### Payment Integration
- Razorpay integration for INR
- Stripe integration for international
- Order creation and verification
- Payment history
- Webhook handling

### Notifications
- Wish creation confirmations
- Fulfillment requests
- Payment updates
- Identity reveal notifications
- Rating notifications

### Admin Panel
- User management (block/unblock)
- Wish moderation
- Fulfillment request approval/rejection
- Payment analytics
- Platform statistics

---

## 🛠️ Configuration

### Razorpay Setup (India)

1. Create account at `razorpay.com`
2. Get API keys from dashboard
3. Add to `.env`:
```
RAZORPAY_KEY_ID=<key_id>
RAZORPAY_KEY_SECRET=<key_secret>
RAZORPAY_WEBHOOK_SECRET=<webhook_secret>
```
4. In frontend `.env`:
```
VITE_RAZORPAY_KEY_ID=<key_id>
```

### Stripe Setup (Global)

1. Create account at `stripe.com`
2. Get API keys from dashboard
3. Add to backend `.env`:
```
STRIPE_SECRET_KEY=<secret_key>
STRIPE_WEBHOOK_SECRET=<webhook_secret>
```
4. In frontend `.env`:
```
VITE_STRIPE_PUBLIC_KEY=<publishable_key>
```

### Email Setup (Nodemailer)

For password reset emails:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

## 📝 Usage Examples

### Register
```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

### Create Wish
```javascript
POST /api/wishes
Headers: Authorization: Bearer <token>
{
  "title": "Laptop for studies",
  "description": "Need a new laptop for my engineering course",
  "category": "Material",
  "budget": 50000,
  "isPublic": true
}
```

### Create Payment Order
```javascript
POST /api/payment/create-razorpay-order
Headers: Authorization: Bearer <token>
{
  "fulfillmentRequestId": "623f456...",
  "amount": 500,
  "currency": "INR"
}
```

---

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 💡 Future Enhancements

- [ ] AI-powered wish suggestions
- [ ] Video call integration for wish fulfillment
- [ ] Social sharing capabilities
- [ ] Rewards and gamification system
- [ ] Anonymous messaging system
- [ ] Mobile app (React Native)
- [ ] Blockchain-based trust system
- [ ] Virtual gifts marketplace

---

## 🆘 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- Verify network access in MongoDB Atlas

### Port Already in Use
```bash
# Kill process on port 5000
npx kill-port 5000

# Kill process on port 5173
npx kill-port 5173
```

### CORS Errors
- Check `FRONTEND_URL` in backend `.env`
- Ensure origins match exactly
- Clear browser cache

### Payment Gateway Issues
- Verify API keys are correct
- Check webhook URLs are configured
- Review payment gateway logs

---

## 📞 Support

For issues or questions:
1. Check documentation
2. Search existing GitHub issues
3. Open new issue with detailed description
4. Contact development team

---

## 👥 Team

Created with ❤️ by the Wishing Lake team.

---

**Happy Wishing! 🌟✨**
