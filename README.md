# FriendChat — Friend-Only Messaging Social App

A full-stack social messaging application where users can only communicate with their friends. Built with **React + Vite** (frontend), **Node.js + Express + SQLite** (backend), and **CometChat** for real-time messaging.

---

## Project Structure

```
friendchat/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── api.js           # Axios instance + typed API helpers
│   │   ├── cometchat.js     # CometChat SDK init + login helpers
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # JWT + CometChat session management
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardLayout.jsx   # Sidebar + nav + real-time badge
│   │   │   ├── UsersPage.jsx         # Discover users, send requests
│   │   │   ├── FriendRequestsPage.jsx # Accept / reject requests
│   │   │   └── ConversationsPage.jsx  # CometChat UI Kit integration
│   │   └── styles/
│   │       └── global.css
│   ├── .env.example         # ← copy to .env and fill in your keys
│   ├── index.html
│   └── vite.config.js
│
├── server/                  # Express backend
│   ├── routes/
│   │   ├── auth.js          # Register, login, /me
│   │   ├── users.js         # Discover users, friends list
│   │   └── friendRequests.js # Send, accept, reject requests
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── db.js                # SQLite schema + prepared queries
│   ├── cometchat.js         # CometChat REST API wrapper
│   ├── index.js             # Express app entry point
│   └── .env.example         # ← copy to .env and fill in your keys
│
└── README.md
```

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v8 or later
- A **CometChat** account (free tier works): https://app.cometchat.com

---

## Quick Start

### 1 — Clone and install dependencies

```bash
git clone <your-repo-url> friendchat
cd friendchat
npm run install:all
```

### 2 — Configure the server

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
COMETCHAT_APP_ID=YOUR_COMETCHAT_APP_ID        # From CometChat dashboard
COMETCHAT_REGION=YOUR_COMETCHAT_REGION        # e.g. us, eu, in
COMETCHAT_API_KEY=YOUR_COMETCHAT_REST_API_KEY # REST API key (not auth key)
JWT_SECRET=some_long_random_string_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3 — Configure the client

```bash
cp client/.env.example client/.env
```

Edit `client/.env`:

```env
VITE_COMETCHAT_APP_ID=YOUR_COMETCHAT_APP_ID
VITE_COMETCHAT_REGION=YOUR_COMETCHAT_REGION
VITE_COMETCHAT_AUTH_KEY=YOUR_COMETCHAT_AUTH_KEY   # Auth Key (different from REST key)
VITE_API_URL=http://localhost:5000/api
```

> **Where to find these values:**
> 1. Go to https://app.cometchat.com → select your app → **API & Auth Keys**
> 2. `APP_ID` — shown at the top
> 3. `REGION` — shown next to APP_ID (e.g. "us")
> 4. `COMETCHAT_REST_API_KEY` (server) — the key labelled "Full Access" or "REST API Key"
> 5. `COMETCHAT_AUTH_KEY` (client) — the key labelled "Auth Only"

### 4 — Run the app

In one terminal:
```bash
npm run dev:server
```

In another:
```bash
npm run dev:client
```

Open **http://localhost:5173** in your browser.

---

## Key Architecture Decisions

### Backend enforcement of messaging rules
Messaging restrictions are enforced **server-side**, not just in the UI:

1. **Friendship table** — Our SQLite DB maintains a `friendships` table. The `/api/friend-requests/check/:userId` endpoint lets the frontend verify before rendering the chat.
2. **CometChat block/unblock** — When a friend request is accepted, the server calls `cometchat.unblockUser()` in both directions via the REST API. This means even if someone bypassed the UI, CometChat itself would reject the message delivery.
3. **JWT-authenticated endpoints** — All API calls require a valid JWT; the server verifies friendship before accepting or rejecting requests.

### Token-based CometChat login
The frontend never sees the CometChat **Auth Key** for actual logins. Instead:
- The server generates a short-lived `authToken` via `POST /v3/users/:uid/auth_tokens`
- The client uses `CometChat.loginWithAuthToken(token)` — more secure than passing the Auth Key to the browser

The Auth Key in the client `.env` is only needed for the CometChat **UI Kit** initialisation (UIKit requires it; this is a CometChat SDK limitation).

### Real-time friend requests
Friend request notifications are delivered in real time via CometChat's **custom message** system. When a request is sent, the server can optionally trigger a `friend_request` custom message to the recipient, which the `FriendRequestsPage` listener picks up and uses to refresh the list without polling. The badge in the sidebar is also updated reactively.

### SQLite for simplicity
SQLite was chosen for zero-configuration setup. For production, swap the `better-sqlite3` adapter for `pg` (PostgreSQL) — the query logic is identical.

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Sign in |
| GET | `/api/auth/me` | Yes | Current user + fresh CC token |
| GET | `/api/users` | Yes | All users with relationship status |
| GET | `/api/users/friends` | Yes | Current user's friends |
| POST | `/api/friend-requests` | Yes | Send a friend request |
| GET | `/api/friend-requests/incoming` | Yes | Pending incoming requests |
| GET | `/api/friend-requests/sent` | Yes | Sent pending requests |
| PATCH | `/api/friend-requests/:id/accept` | Yes | Accept a request |
| PATCH | `/api/friend-requests/:id/reject` | Yes | Reject a request |
| GET | `/api/friend-requests/check/:userId` | Yes | Check if messaging is allowed |

---

## Loom Walkthrough Checklist

For the video, make sure to cover:
- [ ] Registration / login flow
- [ ] Discovering users in the Users section
- [ ] Sending a friend request (demonstrate real-time delivery)
- [ ] Accepting / rejecting from the Friend Requests section
- [ ] Opening a conversation with a friend
- [ ] Showing that non-friends cannot be messaged
- [ ] Walk through the backend code (db.js, friendRequests.js, cometchat.js)
- [ ] Explain the block/unblock enforcement strategy

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Chat UI | CometChat React UI Kit v4 |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Realtime | CometChat SDK + WebSocket |
| Styling | CSS Modules, Inter font |
