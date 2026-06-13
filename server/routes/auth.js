// server/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const { queries } = require("../db");
const cometchat = require("../cometchat");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check uniqueness
    if (queries.getUserByEmail.get(email)) {
      return res.status(409).json({ error: "Email already registered" });
    }
    if (queries.getUserByUsername.get(username)) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const id = uuid();
    const hashed = await bcrypt.hash(password, 12);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    // 1. Save user to our DB
    queries.createUser.run({ id, username, email, password: hashed, avatar });

    // 2. Create the user in CometChat so they can use the SDK
    await cometchat.createUser(id, username, avatar);

    // 3. Issue JWT
    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // 4. Get a CometChat auth token for SDK login
    const ccAuthToken = await cometchat.generateAuthToken(id);

    return res.status(201).json({
      message: "Account created",
      token,
      ccAuthToken,
      user: { id, username, email, avatar },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = queries.getUserByEmail.get(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Fresh CometChat auth token each login
    const ccAuthToken = await cometchat.generateAuthToken(user.id);

    return res.json({
      token,
      ccAuthToken,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Login failed" });
  }
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // Also return a fresh CometChat token
    const ccAuthToken = await cometchat.generateAuthToken(req.user.id);
    return res.json({ user: req.user, ccAuthToken });
  } catch (err) {
    return res.status(500).json({ error: "Could not fetch profile" });
  }
});

module.exports = router;
