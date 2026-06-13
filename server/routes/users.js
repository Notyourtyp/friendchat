// server/routes/users.js
const express = require("express");
const { queries } = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// ── GET /api/users  — discover all users except self ─────────────────────────
router.get("/", authMiddleware, (req, res) => {
  try {
    const users = queries.getAllUsers.all(req.user.id);

    // Enrich each user with relationship status from current user's perspective
    const enriched = users.map((u) => {
      // Check existing friend request in either direction
      const existingReq = queries.getExistingRequest.get(
        req.user.id, u.id, u.id, req.user.id
      );

      // Check friendship
      const friendship = queries.areFriends.get(req.user.id, u.id, u.id, req.user.id);

      let relationshipStatus = "none"; // none | request_sent | request_received | friends
      if (friendship) {
        relationshipStatus = "friends";
      } else if (existingReq) {
        if (existingReq.status === "pending") {
          relationshipStatus =
            existingReq.sender_id === req.user.id ? "request_sent" : "request_received";
        }
      }

      return { ...u, relationshipStatus };
    });

    return res.json({ users: enriched });
  } catch (err) {
    console.error("Get users error:", err.message);
    return res.status(500).json({ error: "Could not fetch users" });
  }
});

// ── GET /api/users/friends  — get current user's friends ─────────────────────
router.get("/friends", authMiddleware, (req, res) => {
  try {
    const friends = queries.getFriendsOfUser.all(
      req.user.id, req.user.id, req.user.id
    );
    return res.json({ friends });
  } catch (err) {
    console.error("Get friends error:", err.message);
    return res.status(500).json({ error: "Could not fetch friends" });
  }
});

// ── GET /api/users/:id  — get a single user's public profile ─────────────────
router.get("/:id", authMiddleware, (req, res) => {
  try {
    const user = queries.getUserById.get(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: "Could not fetch user" });
  }
});

module.exports = router;
