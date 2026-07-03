# 🔐 PassGuard — Enterprise Password Strength Validator

A **market-ready**, full-stack password strength validator with a stunning dark glassmorphism UI, real-time analysis, and a REST API backend — all ported faithfully from the original Java implementation.

---

## 🚀 Quick Start

### Option A: Full-Stack (Recommended)
Requires **Node.js 16+**

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Start the server (serves both API + frontend)
node server.js

# 3. Open browser
# http://localhost:3000
```

### Option B: Frontend Only (No Node.js needed)
Open `frontend/index.html` directly in your browser.
The app works offline using client-side validation. All 10 security rules run in the browser.

---

## 📁 Project Structure

```
password-validator/
├── backend/
│   ├── server.js       # Express REST API (port 3000)
│   ├── validator.js    # All validation logic (ported from Java)
│   └── package.json
└── frontend/
    ├── index.html      # Main application
    ├── css/
    │   └── style.css   # Dark glassmorphism design system
    └── js/
        └── app.js      # UI logic, API calls, animations
```

---

## 🔌 REST API

### `POST /api/validate`
```json
// Request
{
  "username": "john_doe",
  "password": "MyStr0ng!Pass#2024"
}

// Response
{
  "valid": true,
  "score": 95,
  "level": "Very Strong",
  "feedback": [],
  "details": {
    "length": true,
    "hasUpper": true,
    "hasLower": true,
    "hasDigit": true,
    "hasSymbol": true,
    "notBanned": true,
    "noUsername": true,
    "noRepeated": true,
    "noSequential": true,
    "noCommonSeq": true,
    "entropy": 113
  }
}
```

### `GET /api/health`
Returns server status and version.

### `GET /api/policy`
Returns current security policy rules and score thresholds.

**Rate limit:** 60 requests/minute per IP

---

## 🛡️ Security Rules (from Java original)

| Rule | Points |
|---|---|
| Length ≥ 12 characters | +25 |
| Has uppercase (A–Z) | +15 |
| Has lowercase (a–z) | +15 |
| Has digit (0–9) | +15 |
| Has special character | +15 |
| No repeated chars (aaa) | +5 |
| No sequential chars (abc) | +5 |
| No username in password | +5 |
| Not a banned password | +5 |
| Bonus: length ≥ 16 | +5 |
| Bonus: length ≥ 20 | +5 |
| No keyboard sequence | +5 |

### Strength Levels
| Level | Score |
|---|---|
| Very Strong | 90–100 |
| Strong | 75–89 |
| Medium | 60–74 |
| Weak | 40–59 |
| Very Weak | 0–39 |

---

## ✨ Features

- **Real-time live validation** — instant feedback as you type (debounced 300ms)
- **Animated strength bar** with shimmer effect
- **SVG score ring** with smooth stroke animation
- **Entropy estimation** displayed below password field
- **10-rule security checklist** with live pass/fail indicators
- **Confetti animation** for "Very Strong" passwords 🎉
- **Toast notifications** for key events
- **Password visibility toggle**
- **Offline fallback** — works without the backend server
- **Glassmorphism dark UI** with animated background orbs
- **4 info tabs**: Future Scope, Security Policy, Tips, API Docs
- **Fully accessible** — ARIA labels, roles, live regions

---

## 🔮 Future Scope

| Feature | Status |
|---|---|
| HaveIBeenPwned breach check | Planned v2 |
| Password history (no-reuse) | Planned v2 |
| EFF Passphrase generator | Planned v2 |
| Enterprise policy configurator | Enterprise |
| Audit dashboard & analytics | Enterprise |
| TOTP/FIDO2 2FA guidance | Planned v3 |

---

## 🚢 Deployment

### Deploy to any Node.js host (Railway, Render, Heroku, etc.)
```bash
# Set PORT environment variable
PORT=8080 node backend/server.js
```

### Docker (optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./frontend/
WORKDIR /app/backend
RUN npm install --production
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 📜 Standards Compliance
- NIST SP 800-63B password guidelines
- OWASP Authentication Cheat Sheet
- CWE-521: Weak Password Requirements mitigation

---

*Built with Node.js + Express + Vanilla HTML/CSS/JS*
