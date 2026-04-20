# 🚀 QUICK START GUIDE - Wishing Lake

## Complete Production-Ready MERN Setup Instructions

This guide will get you up and running in under 30 minutes.

---

## ✅ PREREQUISITES

- **Node.js v16+** → https://nodejs.org
- **MongoDB** → https://www.mongodb.com/try/download/community
- **Git** → https://git-scm.com
- **VS Code** (or preferred editor)

---

## 📋 STEP-BY-STEP SETUP

### STEP 1: Backend Setup (5 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
touch .env
```

**Copy this into `backend/.env`:**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/wishing-lake
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173

# Razorpay (optional - for testing)
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=test_placeholder
RAZORPAY_WEBHOOK_SECRET=test_placeholder

# Stripe (optional - for testing)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=test_placeholder

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Start MongoDB:**
```bash
# Windows (if installed locally)
mongod

# Or use MongoDB Atlas cloud (recommended)
# Update MONGODB_URI with your cloud connection string
```

**Start Backend Server:**
```bash
npm run dev
```

✅ **Backend should be running on http://localhost:5000**

Test it:
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","message":"Server is running"}
```

---

### STEP 2: Frontend Setup (5 minutes)

```bash
# Open new terminal/navigate to frontend
cd Fontend

# Install dependencies
npm install

# Create .env file
touch .env
```

**Copy this into `Fontend/.env`:**
```
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_placeholder
VITE_STRIPE_PUBLIC_KEY=pk_test_placeholder
```

**Start Frontend:**
```bash
npm run dev
```

✅ **Frontend should be running on http://localhost:5173**

Open browser → `http://localhost:5173`

---

## 🧪 TESTING THE COMPLETE FLOW

### Test User Registration
1. Go to http://localhost:5173
2. Click "Sign Up"
3. Register with:
   - **Name:** John Doe
   - **Email:** john@example.com
   - **Password:** Test123456
4. Should redirect to dashboard

### Test Wish Creation
1. Click "Toss a Wish"
2. Fill form:
   - **Title:** "Need a laptop"
   - **Description:** "For my studies"
   - **Category:** Material
   - **Budget:** 50000
3. Click "Create Wish"
4. Should see success toast

### Test Wish Browsing
1. Click "Fulfill a Wish"
2. Should see wishes list with filters
3. Click on any wish to view details

### Test API Directly
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456",
    "confirmPassword": "Test123456"
  }'

# Login (get token)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'

# Create wish (with token from login)
curl -X POST http://localhost:5000/api/wishes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN_HERE>" \
  -d '{
    "title": "Test Wish",
    "description": "This is a test",
    "category": "Material",
    "budget": 1000,
    "isPublic": true
  }'
```

---

## 📦 COMPLETE FILE STRUCTURE

Ensure your folders match this:

```
Dream-Project/
├── backend/
│   ├── models/
│   │   ├── User.js ✅
│   │   ├── Wish.js ✅
│   │   ├── Payment.js ✅
│   │   ├── FulfillmentRequest.js ✅
│   │   └── Notification.js ✅
│   ├── controllers/
│   │   ├── authController.js ✅
│   │   ├── wishController.js ✅
│   │   ├── paymentController.js ✅
│   │   ├── userController.js ✅
│   │   └── adminController.js ✅
│   ├── routes/
│   │   ├── authRoutes.js ✅
│   │   ├── wishRoutes.js ✅
│   │   ├── paymentRoutes.js ✅
│   │   ├── userRoutes.js ✅
│   │   └── adminRoutes.js ✅
│   ├── middleware/
│   │   └── authMiddleware.js ✅
│   ├── config/
│   │   └── database.js ✅
│   ├── server.js ✅
│   ├── package.json ✅
│   └── .env
│
└── Fontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx ✅
    │   │   └── Loading.jsx ✅
    │   ├── pages/
    │   │   ├── LandingPage.jsx (needs update)
    │   │   ├── LoginPage.jsx (needs update)
    │   │   ├── RegistrationPage.jsx (needs update)
    │   │   ├── DashboardPage.jsx (template)
    │   │   ├── TossWishPage.jsx (template)
    │   │   ├── FulfillWishPage.jsx (template)
    │   │   └── MyWishesPage.jsx (template)
    │   ├── context/
    │   │   └── authContext.jsx ✅
    │   ├── hooks/
    │   │   └── useAuth.js ✅
    │   ├── services/
    │   │   └── api.js ✅
    │   ├── App.jsx ✅
    │   ├── main.jsx
    │   └── index.css
    ├── package.json ✅
    ├── vite.config.js
    ├── .env
    └── .env.example ✅
```

---

## 🔑 ADMIN LOGIN

To create an admin user:

1. Register normally via UI
2. Open MongoDB and update the user:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Then access admin panel at `/admin` (you need to build this page)

---

## 🛠️ COMMON ISSUES & FIXES

### Issue: "Cannot find module 'mongoose'"
```bash
# Solution:
cd backend
npm install
```

### Issue: Port 5000 already in use
```bash
# Windows - Kill process
npx kill-port 5000

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Issue: MongoDB connection error
```bash
# Check if MongoDB is running:
mongod

# Or use MongoDB Atlas:
# 1. Create cluster at mongodb.com/atlas
# 2. Copy connection string
# 3. Update MONGODB_URI in .env
```

### Issue: CORS error on login
```
Check that FRONTEND_URL in backend .env matches http://localhost:5173
```

### Issue: Token not saving
```javascript
// Clear browser localStorage:
// F12 → Application → LocalStorage → Clear All
```

---

## 📚 REMAINING PAGE TEMPLATES TO BUILD

Based on the existing folder structure, you need to complete these pages:

### `src/pages/LoginPage.jsx`
- Email/password form
- Error handling
- Loading state
- Link to registration

### `src/pages/RegistrationPage.jsx`
- Name/email/password form
- Password confirmation
- Validation
- Link to login

### `src/pages/DashboardPage.jsx`
- User greeting
- Statistics cards (wishes made, fulfilled, pending)
- Quick action buttons
- Recent activity
- Profile section

### `src/pages/TossWishPage.jsx`
- Form with: title, description, category, budget, image
- Category dropdown
- Image upload
- Submit button
- Preview

### `src/pages/FulfillWishPage.jsx`
- List of public wishes
- Search/filter by category
- Wish cards
- "Fulfill" button per wish
- Payment flow integration

### `src/pages/MyWishesPage.jsx`
- Tabs: "Created", "Fulfilling", "Fulfilled"
- Wish status indicators
- Edit/delete buttons for own wishes
- View fulfillment requests
- Rating system

---

## 🚀 DEPLOYING YOUR APP

### Deploy Backend to Render

1. **Push to GitHub:**
```bash
git add .
git commit -m "Deploy Wishing Lake"
git push origin main
```

2. **Create Render Account:**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create Web Service:**
   - Click "New Web Service"
   - Connect GitHub repo
   - Set Build Command: `npm install`
   - Set Start Command: `npm start`
   - Add Environment Variables from your `.env`
   - Deploy

4. **Get Backend URL:** `https://your-service.onrender.com`

### Deploy Frontend to Vercel

1. **Create Vercel Account:**
   - Go to https://vercel.com
   - Sign in with GitHub

2. **Import Project:**
   - Select Fontend folder
   - Set Framework: Vite
   - Add Environment Variables:
     - `VITE_API_URL=https://your-backend.onrender.com/api`
   - Deploy

3. **Get Frontend URL:** `https://your-app.vercel.app`

### Configure Production Database

1. **Go to MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
2. **Create Free Cluster**
3. **Create Database User** with password
4. **Whitelist IPs** (or allow all for testing)
5. **Copy Connection String**
6. **Add to Render Backend Environment:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wishing-lake?retryWrites=true&w=majority
   ```

---

## 📞 FREQUENTLY ASKED QUESTIONS

**Q: Can I skip Razorpay setup?**  
A: Yes! For testing, use placeholder keys. Implement payment UI but it won't process real payments.

**Q: How do I reset the database?**  
A: In MongoDB:
```javascript
db.dropDatabase()  // Deletes everything
```

**Q: Can I use SQLite instead of MongoDB?**  
A: Yes, but you'd need to rewrite all Mongoose models to use a SQL library.

**Q: How do I add Google authentication?**  
A: Install `passport-google-oauth20` and configure a Google OAuth app in GCP console.

**Q: Is it production-ready?**  
A: The backend structure is production-ready, but you should add:
- Input sanitization (npm install xss)
- Database backups
- Error monitoring (Sentry)
- Analytics
- CDN for static files

---

## 📖 NEXT STEPS

1. ✅ Complete frontend pages (use above templates)
2. ✅ Test all API endpoints with Postman
3. ✅ Integrate payment gateways (Razorpay/Stripe)
4. ✅ Add validation & error handling
5. ✅ Setup CI/CD pipeline
6. ✅ Deploy to production
7. ✅ Monitor with error tracking
8. ✅ Optimize performance

---

## 💡 TIPS FOR SUCCESS

- **Use Postman** to test APIs before building UI
- **Build one page at a time** and test it
- **Use React DevTools** for debugging state
- **Keep API calls in services/api.js** for reusability
- **Test on mobile** early and often
- **Use `.gitignore`** to exclude `.env` from GitHub

---

## 🎉 YOU'RE ALL SET!

Start with:
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd Fontend && npm run dev
```

Visit http://localhost:5173 and start building your magic! ✨

---

**Questions?** Check the main README.md for detailed API documentation.

**Happy coding!** 🚀
