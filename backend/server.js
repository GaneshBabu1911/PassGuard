/**
 * Password Strength Validator - Express REST API Server
 */

"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { validate } = require("./validator");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security middleware ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false // allow inline scripts in served HTML
}));

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// ── Rate limiting ───────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait a moment.",
    retryAfter: 60
  }
});

// ── Serve static frontend ───────────────────────────────────────
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// ── API Routes ──────────────────────────────────────────────────

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "Password Strength Validator API"
  });
});

// Main validation endpoint
app.post("/api/validate", apiLimiter, (req, res) => {
  const { username = "", password = "" } = req.body;

  // Basic input validation
  if (typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input: password must be a string." });
  }

  if (typeof username !== "string") {
    return res.status(400).json({ error: "Invalid input: username must be a string." });
  }

  if (password.length > 512) {
    return res.status(400).json({ error: "Password too long (max 512 characters)." });
  }

  try {
    const result = validate(username, password);

    // Log summary (no actual passwords logged for security)
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      usernameLen: username.length,
      passwordLen: password.length,
      score: result.score,
      valid: result.valid
    };
    console.log("[VALIDATE]", JSON.stringify(logEntry));

    return res.json(result);
  } catch (err) {
    console.error("[ERROR]", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Password policy info
app.get("/api/policy", (req, res) => {
  res.json({
    minLength: 12,
    requirements: [
      "At least 12 characters",
      "At least one uppercase letter",
      "At least one lowercase letter",
      "At least one digit",
      "At least one special character",
      "Cannot contain the username",
      "Cannot be a commonly used password",
      "No repeated characters (3+ consecutive)",
      "No sequential characters (abc, 123, etc.)"
    ],
    scoring: {
      "Very Strong": "90–100",
      "Strong": "75–89",
      "Medium": "60–74",
      "Weak": "40–59",
      "Very Weak": "0–39"
    }
  });
});

// Catch-all: serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ── Start server ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔐 Password Strength Validator API`);
  console.log(`   Server  : http://localhost:${PORT}`);
  console.log(`   Health  : http://localhost:${PORT}/api/health`);
  console.log(`   Validate: POST http://localhost:${PORT}/api/validate`);
  console.log(`   Policy  : GET  http://localhost:${PORT}/api/policy`);
  console.log(`\n   Frontend served at: http://localhost:${PORT}\n`);
});
