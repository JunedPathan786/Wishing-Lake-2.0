# 🌙 Wishing Lake of Smiles — MERN Stack v2.0

A full-stack production-ready application where users drop wishes into a magical lake and kind strangers can fulfill them.

---

## 🏗️ Architecture

```
wishing-lake/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Navbar, WishCard, CoinDropModal, FulfillModal
│   │   ├── context/            # AuthContext, SocketContext
│   │   ├── pages/              # All page components
│   │   ├── services/           # Axios API client (api.js)
│   │   ├── App.jsx             # Router with protected routes
│   │   └── index.css           # Tailwind + design system
│   ├── tailwind.config.js      # Emotion colors, animations, glassmorphism
│   └── vite.config.js
│
├── server/                     # Node.js + Express backend
│   ├── controllers/            # Auth, Wish, Fulfillment, Chat, AI, Admin
│   ├── middleware/             # auth.js, errorHandler.js, validate.js
│   ├── models/                 # User, Wish, ChatRoom, Message, Notification, FulfillmentRequest
│   ├── routes/                 # auth, wishes, fulfillment, chat, notifications, admin, ai, users
│   ├── services/               # socketService.js, emailService.js
│   ├── utils/                  # logger.js, errors.js, helpers.js, seeder.js
│   └── server.js               # Entry point
│
├── vercel.json                 # Frontend deployment (Vercel)
├── render.yaml                 # Backend deployment (Render)
└── package.json                # Monorepo scripts
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)
- Gmail account with App Password for emails
- OpenAI API key (optional — AI features degrade gracefully without it)

### 1. Clone & Install

```bash
git clone <your-repo>
cd wishing-lake
npm run install:all
```

### 2. Configure Environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your values

# Client
cp client/.env.example client/.env
# Edit client/.env with your values
```

### 3. Run in Development

```bash
npm run dev
# Server: http://localhost:5000
# Client: http://localhost:5173
```

---

## 🔐 Environment Variables

### Server (`server/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Access token signing secret (64+ chars) | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | ✅ |
| `JWT_EXPIRE` | Access token lifetime (e.g. `15m`) | ✅ |
| `JWT_REFRESH_EXPIRE` | Refresh token lifetime (e.g. `7d`) | ✅ |
| `CLIENT_URL` | Frontend URL for CORS | ✅ |
| `EMAIL_USER` | Gmail address for sending emails | Optional |
| `EMAIL_PASS` | Gmail App Password | Optional |
| `OPENAI_API_KEY` | OpenAI key for Wish Oracle | Optional |
| `ADMIN_EMAIL` | Seeded admin email | Optional |
| `ADMIN_PASSWORD` | Seeded admin password | Optional |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Backend Socket.io URL |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Sign in |
| POST | `/api/auth/refresh-token` | — | Refresh access token |
| POST | `/api/auth/logout` | ✅ | Invalidate session |
| GET  | `/api/auth/verify-email/:token` | — | Verify email |
| POST | `/api/auth/forgot-password` | — | Request reset link |
| PATCH | `/api/auth/reset-password/:token` | — | Reset password |
| GET  | `/api/auth/me` | ✅ | Get current user |
| PATCH | `/api/auth/update-profile` | ✅ | Update profile |
| PATCH | `/api/auth/change-password` | ✅ | Change password |

### Wishes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/wishes` | Optional | Public feed (paginated, filterable) |
| GET  | `/api/wishes/mine` | ✅ | My wishes |
| GET  | `/api/wishes/:id` | Optional | Single wish |
| POST | `/api/wishes` | ✅ | Create wish (coin drop) |
| PATCH | `/api/wishes/:id` | ✅ | Edit wish |
| DELETE | `/api/wishes/:id` | ✅ | Delete wish |
| PATCH | `/api/wishes/:id/like` | ✅ | Toggle like |
| POST | `/api/wishes/:id/report` | ✅ | Report wish |

#### Query params for GET `/api/wishes`:
- `page`, `limit`, `sort` (`-createdAt` / `-likeCount` / `-viewCount`)
- `emotion` (`hopeful` / `sad` / `urgent` / `dreamy` / `joyful` / `anxious` / `grateful`)
- `category` (`health` / `love` / `career` / etc.)
- `search` (full-text search)

### Fulfillment
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/fulfillment/wish/:wishId/offer` | ✅ | Offer to fulfill |
| PATCH | `/api/fulfillment/:requestId/respond` | ✅ | Approve or reject offer |
| GET  | `/api/fulfillment/wish/:wishId` | ✅ | Get requests for a wish |
| GET  | `/api/fulfillment/mine` | ✅ | My fulfillment history |
| PATCH | `/api/fulfillment/:requestId/complete` | ✅ | Mark as complete |

### Chat (Permission-Based)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/chat` | ✅ | My chat rooms |
| POST | `/api/chat/request` | ✅ | Request chat |
| PATCH | `/api/chat/:chatRoomId/respond` | ✅ | Accept / decline |
| GET  | `/api/chat/:chatRoomId/messages` | ✅ | Fetch messages |
| POST | `/api/chat/:chatRoomId/messages` | ✅ | Send message |
| DELETE | `/api/chat/messages/:messageId` | ✅ | Delete message |

### AI / Oracle
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/ai/analyze/:wishId` | ✅ | Oracle wish analysis |
| GET  | `/api/ai/recommendations` | ✅ | Personalized wish recommendations |
| POST | `/api/ai/oracle/chat` | ✅ | Conversational Oracle |

### Admin (admin role only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/admin/stats` | Dashboard statistics |
| GET  | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:userId` | Update user status/role |
| GET  | `/api/admin/wishes/reported` | Reported wishes |
| PATCH | `/api/admin/wishes/:wishId/moderate` | Approve / reject / archive |
| GET  | `/api/admin/chats/pending` | Pending chat requests |
| PATCH | `/api/admin/chats/:chatRoomId` | Approve / reject chat |
| POST | `/api/admin/broadcast` | Send notification to all users |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/users/leaderboard` | — | Top karma earners |
| GET  | `/api/users/:username/profile` | Optional | Public profile |
| PATCH | `/api/users/block/:userId` | ✅ | Block user |
| PATCH | `/api/users/unblock/:userId` | ✅ | Unblock user |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/notifications` | ✅ | Get notifications |
| PATCH | `/api/notifications/read-all` | ✅ | Mark all read |
| PATCH | `/api/notifications/:id/read` | ✅ | Mark one read |
| DELETE | `/api/notifications/:id` | ✅ | Delete notification |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_lake` | — | Subscribe to public wish feed |
| `leave_lake` | — | Unsubscribe from feed |
| `join_chat` | `{ chatRoomId }` | Join a chat room |
| `leave_chat` | `{ chatRoomId }` | Leave a chat room |
| `typing_start` | `{ chatRoomId }` | Start typing indicator |
| `typing_stop` | `{ chatRoomId }` | Stop typing indicator |
| `wish_ripple` | `{ wishId, emotion }` | Broadcast ripple effect |
| `ping` | — | Keep-alive + update lastSeen |
| `get_online_users` | — | Request online user list |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_wish` | `WishObject` | New public wish dropped |
| `wish_ripple` | `{ wishId, emotion, userId }` | Ripple animation trigger |
| `user_online` | `{ userId, username }` | User came online |
| `user_offline` | `{ userId }` | User went offline |
| `online_users` | `{ userIds }` | Full online users list |
| `new_message` | `MessageObject` | New chat message |
| `message_deleted` | `{ messageId }` | Message was deleted |
| `typing` | `{ userId, username, chatRoomId, isTyping }` | Typing indicator |
| `user_joined_chat` | `{ userId, username, chatRoomId }` | User joined chat |
| `chat_request` | `{ chatRoomId, from }` | Incoming chat request |
| `chat_accepted` | `{ chatRoomId, acceptedBy }` | Chat request accepted |
| `fulfillment_request` | `{ fulfillmentId, wishTitle, fulfillerName }` | Fulfillment offer received |
| `fulfillment_approved` | `{ chatRoomId, wishTitle, karmaEarned }` | Your offer was accepted |
| `message_notification` | `{ chatRoomId, senderName, preview }` | New message preview |
| `broadcast_notification` | `{ title, message }` | Admin broadcast |

---

## 🎨 Design System

The design follows the **Jewel & Luxury + Organic & Earthy** archetype:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#020617` | Page background |
| Surface | `#0F172A` | Cards, panels |
| Gold | `#FDE047` | CTAs, accents, hopeful emotion |
| Silver-Blue | `#38BDF8` | Links, secondary accents |
| Heading font | Cormorant Garamond | All H1–H3 |
| Body font | Outfit | All body text, buttons |

### Emotion Color Map
| Emotion | Color | Use case |
|---------|-------|----------|
| Hopeful | `#FBBF24` | Default — warm gold |
| Dreamy | `#E2E8F0` | Soft white |
| Joyful | `#34D399` | Emerald green |
| Urgent | `#F87171` | Warm red |
| Grateful | `#A78BFA` | Soft purple |
| Anxious | `#FB923C` | Amber orange |
| Sad / Wistful | `#94A3B8` | Cool slate |

---

## 🚢 Deployment

### Frontend → Vercel

```bash
# In Vercel dashboard:
# Build Command: cd client && npm install && npm run build
# Output Directory: client/dist
# Set env vars:
#   VITE_API_URL = https://your-backend.onrender.com/api
#   VITE_SOCKET_URL = https://your-backend.onrender.com
```

### Backend → Render

```bash
# Use render.yaml (already configured)
# Or manually:
# Root Directory: server
# Build: npm install
# Start: node server.js
# Set all env vars from server/.env.example
```

### Database → MongoDB Atlas

1. Create a free M0 cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a database user
3. Whitelist `0.0.0.0/0` (or Render's IPs) in Network Access
4. Copy the connection string → set as `MONGO_URI`

---

## 🔒 Security Features

- **Helmet** — sets 14 security HTTP headers
- **CORS** — restricted to `CLIENT_URL` only
- **Rate limiting** — 100 req/15min globally, 10 req/15min on auth
- **MongoDB sanitization** — prevents NoSQL injection via `express-mongo-sanitize`
- **bcrypt** — password hashing with cost factor 12
- **JWT** — short-lived access tokens (15m) + rotating refresh tokens
- **Input validation** — `express-validator` on every mutation endpoint
- **XSS** — all inputs sanitized
- **Error handling** — production errors never leak stack traces

---

## 📊 Database Indexes

Key indexes created automatically:
- `User`: `{ email: 1 }`, `{ username: 1 }`, `{ role: 1 }`
- `Wish`: `{ author, status }`, `{ visibility, status, createdAt }`, text index on `title + description + tags`
- `ChatRoom`: `{ participants: 1 }`, `{ status, lastActivity }`
- `Message`: `{ chatRoom, createdAt }`
- `Notification`: `{ recipient, isRead, createdAt }`, TTL index (auto-delete after 90 days)
- `FulfillmentRequest`: unique `{ wish, fulfiller }` compound index

---

*Made with 💛 — Wishing Lake of Smiles v2.0*
