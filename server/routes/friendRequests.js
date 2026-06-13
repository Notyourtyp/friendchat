// server/routes/friendRequests.js
const express = require("express");
const { v4: uuid } = require("uuid");
const { queries } = require("../db");
const cometchat = require("../cometchat");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// ── POST /api/friend-requests  — send a friend request ───────────────────────
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId) return res.status(400).json({ error: "receiverId required" });
    if (receiverId === req.user.id) {
      return res.status(400).json({ error: "Cannot send request to yourself" });
    }

    // Check the receiver exists
    const receiver = queries.getUserById.get(receiverId);
    if (!receiver) return res.status(404).json({ error: "User not found" });

    // Already friends?
    const alreadyFriends = queries.areFriends.get(
      req.user.id, receiverId, receiverId, req.user.id
    );
    if (alreadyFriends) {
      return res.status(409).json({ error: "Already friends" });
    }

    // Existing pending request in either direction?
    const existingReq = queries.getExistingRequest.get(
      req.user.id, receiverId, receiverId, req.user.id
    );
    if (existingReq && existingReq.status === "pending") {
      return res.status(409).json({ error: "Friend request already exists" });
    }

    const id = uuid();
    queries.createFriendRequest.run({ id, sender_id: req.user.id, receiver_id: receiverId });

    const created = queries.getFriendRequest.get(id);
    return res.status(201).json({ request: created });
  } catch (err) {
    console.error("Send friend request error:", err.message);
    return res.status(500).json({ error: "Could not send friend request" });
  }
});

// ── GET /api/friend-requests/incoming  — pending requests TO current user ────
router.get("/incoming", authMiddleware, (req, res) => {
  try {
    const requests = queries.getPendingRequestsForUser.all(req.user.id);
    return res.json({ requests });
  } catch (err) {
    return res.status(500).json({ error: "Could not fetch requests" });
  }
});

// ── GET /api/friend-requests/sent  — requests FROM current user ───────────────
router.get("/sent", authMiddleware, (req, res) => {
  try {
    const requests = queries.getSentRequests.all(req.user.id);
    return res.json({ requests });
  } catch (err) {
    return res.status(500).json({ error: "Could not fetch sent requests" });
  }
});

// ── PATCH /api/friend-requests/:id/accept ────────────────────────────────────
router.patch("/:id/accept", authMiddleware, async (req, res) => {
  try {
    const request = queries.getFriendRequest.get(req.params.id);

    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.receiver_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorised to accept this request" });
    }
    if (request.status !== "pending") {
      return res.status(409).json({ error: "Request is no longer pending" });
    }

    // 1. Update request status
    queries.updateRequestStatus.run("accepted", request.id);

    // 2. Create friendship (canonical: smaller id goes in user_id_a)
    const [a, b] = [request.sender_id, request.receiver_id].sort();
    queries.createFriendship.run({ id: uuid(), user_id_a: a, user_id_b: b });

    // 3. Unblock each other in CometChat so messaging is permitted
    //    (We block everyone by default — see notes in README)
    await Promise.allSettled([
      cometchat.unblockUser(request.sender_id, request.receiver_id),
      cometchat.unblockUser(request.receiver_id, request.sender_id),
    ]);

    return res.json({ message: "Friend request accepted", friendshipCreated: true });
  } catch (err) {
    console.error("Accept request error:", err.message);
    return res.status(500).json({ error: "Could not accept request" });
  }
});

// ── PATCH /api/friend-requests/:id/reject ────────────────────────────────────
router.patch("/:id/reject", authMiddleware, (req, res) => {
  try {
    const request = queries.getFriendRequest.get(req.params.id);

    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.receiver_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorised to reject this request" });
    }
    if (request.status !== "pending") {
      return res.status(409).json({ error: "Request is no longer pending" });
    }

    queries.updateRequestStatus.run("rejected", request.id);
    return res.json({ message: "Friend request rejected" });
  } catch (err) {
    console.error("Reject request error:", err.message);
    return res.status(500).json({ error: "Could not reject request" });
  }
});

// ── GET /api/friend-requests/check/:userId  — check messaging permission ─────
// Used by the backend guard before allowing a message send.
router.get("/check/:userId", authMiddleware, (req, res) => {
  try {
    const friendship = queries.areFriends.get(
      req.user.id, req.params.userId, req.params.userId, req.user.id
    );
    return res.json({ canMessage: Boolean(friendship) });
  } catch (err) {
    return res.status(500).json({ error: "Could not check relationship" });
  }
});

module.exports = router;
