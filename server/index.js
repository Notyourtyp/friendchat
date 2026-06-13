// server/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const friendRequestRoutes = require("./routes/friendRequests");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friend-requests", friendRequestRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: "Not found" }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅  FriendChat API running on http://localhost:${PORT}\n`);
});
