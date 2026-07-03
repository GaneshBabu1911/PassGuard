# 🔐 PassGuard — Enterprise Password Strength Validator

A **market-ready**, multi-page full-stack password strength validator with a stunning dark/light glassmorphism UI, real-time analysis, and serverless backend API — optimized for instant deployment to **Vercel**.

---

## 📁 Vercel Project Structure

To ensure correct routing and prevent 404 errors, the files are structured in the standard Vercel layout:

```
password-validator/
├── api/                # Serverless Backend API
│   ├── _validator.js   # Shared validation logic
│   ├── validate.js     # POST /api/validate serverless endpoint
│   ├── health.js       # GET /api/health serverless endpoint
│   └── policy.js       # GET /api/policy serverless endpoint
├── public/             # Static Frontend Assets (Served at root "/")
│   ├── css/
│   │   └── style.css   # Premium Dark/Light theme design system
│   ├── js/
│   │   ├── app.js          # Validator UI logic
│   │   ├── breach.js       # HaveIBeenPwned live checker
│   │   ├── dashboard.js    # HTML5 Canvas line/bar charts logic
│   │   ├── generator.js    # EFF Passphrase generator & entropy engine
│   │   ├── history.js      # Audit trail logic
│   │   ├── policy.js       # Custom security policy manager
│   │   ├── shared.js       # Navigation, theme toggle, and utility functions
│   │   ├── twofa.js        # Interactive 2FA setup guide
│   │   └── validator-core.js # Client-side validation fallback
│   ├── index.html          # Core password validator page
│   ├── breach.html         # Data breach lookup page
│   ├── generator.html      # Memorability-focused passphrase generator
│   ├── history.html        # Local validation history log
│   ├── policy.html         # Organization policy configurator
│   ├── dashboard.html      # Security posture & trends dashboard
│   └── twofa.html          # Two-factor authentication checklist & guide
├── package.json        # Node configuration
└── vercel.json         # Vercel deployment settings (clean URLs)
```

---

## 🚀 How to Deploy to Vercel

### Option 1: Vercel Dashboard (Easiest)
1. Push this project folder to your GitHub, GitLab, or Bitbucket repository.
2. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
3. Select your repository and click **Import**.
4. Click **Deploy**. Vercel will automatically detect the static assets in `/public` and serve them at the root route `/`, and run your API functions under `/api/*`.

### Option 2: Vercel CLI (Command Line)
If you have the Vercel CLI installed on your machine:
```bash
# 1. Run the deployment command from the project root
vercel

# 2. To deploy directly to production
vercel --prod
```

---

## 💻 Local Development with Vercel

To run the serverless functions and the frontend locally exactly as they would run on Vercel:

```bash
# 1. Install Vercel CLI if you haven't already
npm install -g vercel

# 2. Start the local serverless development server
vercel dev

# 3. Open browser
# http://localhost:3000
```
*(The dev server will watch files and automatically hot-reload both serverless endpoints and frontend assets).*

---

## 🔌 Serverless REST API

All serverless functions are written in pure Node.js (CommonJS) and run instantly as Vercel Edge/Serverless functions.

### `POST /api/validate`
Validates password strength against the default or customized policy.
```json
// Request
{
  "username": "admin_user",
  "password": "MyS3curePass!2026"
}

// Response
{
  "valid": true,
  "score": 100,
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
    "entropy": 110
  }
}
```

### `GET /api/health`
Health check endpoint verifying the serverless API functionality.

### `GET /api/policy`
Returns security policy requirements and scoring configuration.

---

## ✨ Application Modules

1. **Validator (index.html)**: Live-typing scoring feedback with interactive checks, animated SVG score ring, strength meter, and password visibility toggle.
2. **Breach Check (breach.html)**: Queries the official HaveIBeenPwned API using **k-anonymity** (hashes are generated locally, and only the first 5 characters are sent to preserve privacy).
3. **Generator (generator.html)**: Generates high-entropy passphrases using a curated 512-word list. Supports customizable length, symbols, capitalisation, numbers, and lists calculated crack time.
4. **History (history.html)**: Keeps a local audit log of previous validation attempts (timestamp, score, level, validation status). *No passwords are ever saved for security.*
5. **Policy Configurator (policy.html)**: Customize password criteria (length, character requirements, custom banned keywords) and preview its feasibility in real-time.
6. **Dashboard (dashboard.html)**: Interactive reports displaying validation history distribution, security posture rating, and an HTML5 Canvas score trend chart.
7. **2FA Guide (twofa.html)**: Fully interactive tutorial explaining modern 2FA methods (TOTP apps, hardware keys, passkeys) with personal setup checklists.

---

## 🛡️ Standards Alignment
- **NIST SP 800-63B**: Password length, complexity, and reuse standards.
- **OWASP Application Security Verification Standard (ASVS)**: Modern authentication requirements.
- **CWE-521**: Weak password requirements protection.

---

*Built with Vanilla HTML/CSS/JS & Node.js Serverless Functions.*
