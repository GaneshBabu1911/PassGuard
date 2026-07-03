module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  res.status(200).json({
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
};
