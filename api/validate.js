const { validate } = require("./_validator");

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { username = "", password = "" } = req.body || {};

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
    return res.status(200).json(result);
  } catch (err) {
    console.error("[ERROR]", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
};
