"use strict";
/* twofa.js — 2FA interactive guide */

const CHECKLIST_KEY = "pg_2fa_checklist";
const SELECTED_METHOD_KEY = "pg_2fa_method";

const METHOD_STEPS = {
  totp: {
    icon: "📱", title: "TOTP Authenticator Setup", badge: "Most Popular",
    steps: [
      { title: "Download an authenticator app", desc: "Install Google Authenticator, Authy, Bitwarden, or Microsoft Authenticator on your phone. Authy and Bitwarden support encrypted cloud backup." },
      { title: "Go to your account's security settings", desc: "Navigate to Settings → Security → Two-Factor Authentication (or 2-Step Verification) on the site you want to protect." },
      { title: "Select 'Authenticator App' option", desc: "Choose the option for an authenticator app (not SMS). The site will show you a QR code." },
      { title: "Scan the QR code", desc: "Open your authenticator app, tap the '+' or 'Add account' button, then scan the QR code shown on the website." },
      { title: "Enter the 6-digit code to verify", desc: "Type the 6-digit time-based code shown in your app into the website's verification field. Codes expire every 30 seconds." },
      { title: "Save your backup codes", desc: "Download or copy the emergency backup codes provided. Store them in a password manager or printed in a secure location. These are your recovery option if you lose your phone." },
    ]
  },
  hardware: {
    icon: "🔑", title: "Hardware Security Key Setup", badge: "Most Secure",
    steps: [
      { title: "Purchase a hardware key", desc: "Buy a FIDO2/WebAuthn-compatible key: YubiKey 5 Series (most popular), Google Titan Key, or SoloKey. Get at least 2 keys — one as backup." },
      { title: "Register the key on your account", desc: "Go to Settings → Security → 2FA or Security Keys. Select 'Add security key'. Follow the prompts." },
      { title: "Insert and tap your key", desc: "Plug in your key via USB (or tap via NFC). When prompted, physically touch the gold circle or button on the key to confirm." },
      { title: "Name your key", desc: "Give your key a descriptive name (e.g. 'Primary YubiKey' or 'Backup Titan'). This helps you manage multiple keys later." },
      { title: "Register your backup key", desc: "Repeat the registration process for your backup key. Store the backup key somewhere safe (e.g. home safe) in case your primary key is lost." },
      { title: "Test login with your key", desc: "Sign out and sign back in. You should be prompted to insert and tap your hardware key. Verify it works before relying on it." },
    ]
  },
  passkey: {
    icon: "🪪", title: "Passkey (FIDO2) Setup", badge: "Future-Proof",
    steps: [
      { title: "Check browser & OS support", desc: "Passkeys work in Chrome 108+, Safari 16+, Edge 108+, Firefox 122+. On iOS 16+, Android 9+, Windows Hello, or macOS with Touch ID." },
      { title: "Enable passkey option on the site", desc: "Go to the site's Security settings and look for 'Passkeys' or 'Sign-in with passkey'. Many major sites (Google, Apple, GitHub, Microsoft) now support this." },
      { title: "Create your passkey", desc: "Click 'Create passkey'. Your browser or OS will prompt you with your biometric (fingerprint, face) or PIN to create a cryptographic key pair. The private key stays on your device." },
      { title: "Authenticate and confirm", desc: "Confirm with your fingerprint, Face ID, or Windows Hello PIN. The passkey is now created and linked to this site — no password needed!" },
      { title: "Sync across devices (optional)", desc: "On Apple devices, passkeys sync via iCloud Keychain. On Android, via Google Password Manager. On Chrome, via Google Account. Enable sync for multi-device access." },
      { title: "Keep a backup method", desc: "Enable a backup (recovery) option on the account — another passkey, a hardware key, or backup codes — in case your primary device is lost." },
    ]
  },
  sms: {
    icon: "💬", title: "SMS / Email OTP Setup", badge: "Basic Protection",
    steps: [
      { title: "⚠️ Warning — SMS is less secure", desc: "SMS 2FA is vulnerable to SIM-swap attacks where criminals convince carriers to transfer your number to a new SIM. Use only if no other option is available." },
      { title: "Go to Security Settings", desc: "Navigate to Settings → Security → Two-Factor Authentication on your account." },
      { title: "Enter your mobile number", desc: "Add the phone number you want codes sent to. Use a number that only you control." },
      { title: "Verify with an SMS code", desc: "You'll receive a 6-digit code via text. Enter it to confirm your number is working." },
      { title: "Enable the feature", desc: "Confirm the setup. From now on, logins will require a code texted to your number." },
      { title: "Upgrade when possible", desc: "Once SMS 2FA is active, check if the service offers TOTP app or hardware key options. Switch to those for better security." },
    ]
  }
};

let selectedMethod = Storage.get(SELECTED_METHOD_KEY, null);
let completedSteps = Storage.get(CHECKLIST_KEY, {});

document.addEventListener("DOMContentLoaded", () => {
  injectNav("twofa");
  loadChecklist();
  updateChecklistProgress();

  if (selectedMethod) {
    selectMethod(selectedMethod);
  }
});

function selectMethod(method) {
  selectedMethod = method;
  Storage.set(SELECTED_METHOD_KEY, method);

  // Highlight selected card
  document.querySelectorAll(".method-card").forEach(c => {
    c.classList.toggle("selected", c.dataset.method === method);
  });

  const config = METHOD_STEPS[method];
  if (!config) return;

  document.getElementById("setup-icon").textContent = config.icon;
  document.getElementById("setup-title").textContent = config.title;
  document.getElementById("setup-badge").textContent = config.badge;
  document.getElementById("setup-placeholder").style.display = "none";
  document.getElementById("app-picker-card").style.display = method === "totp" ? "block" : "none";

  renderSteps(method, config.steps);
}

function renderSteps(method, steps) {
  const list = document.getElementById("setup-steps");
  const tracker = document.getElementById("progress-tracker");
  const completion = document.getElementById("completion-banner");

  const methodKey = `method_${method}`;
  const stepsDone = completedSteps[methodKey] || {};
  const allDone = steps.every((_, i) => stepsDone[i]);

  // Progress bar
  tracker.style.display = "flex";
  tracker.innerHTML = steps.map((_, i) => {
    const done = stepsDone[i];
    const current = !done && steps.slice(0,i).every((__,j) => stepsDone[j]);
    return `<div class="prog-step ${done?"done":current?"current":""}"></div>`;
  }).join("");

  list.style.display = "flex";
  list.innerHTML = steps.map((s, i) => `
    <div class="step-item ${stepsDone[i]?"done":""}" onclick="toggleStep('${method}',${i})">
      <div class="step-num">${stepsDone[i]?"✓":i+1}</div>
      <div class="step-content">
        <div class="step-title">${s.title}</div>
        <div class="step-desc">${s.desc}</div>
      </div>
    </div>`).join("");

  completion.style.display = allDone ? "block" : "none";
  if (allDone) launchConfetti(40);
}

function toggleStep(method, idx) {
  const methodKey = `method_${method}`;
  if (!completedSteps[methodKey]) completedSteps[methodKey] = {};
  completedSteps[methodKey][idx] = !completedSteps[methodKey][idx];
  Storage.set(CHECKLIST_KEY, completedSteps);
  renderSteps(method, METHOD_STEPS[method].steps);
}

function toggleApp(el) {
  el.classList.toggle("selected");
}

// Personal checklist
function toggleCheck(el) {
  el.classList.toggle("done");
  const checkId = el.id;
  completedSteps[checkId] = el.classList.contains("done");
  Storage.set(CHECKLIST_KEY, completedSteps);
  updateChecklistProgress();
  if (completedSteps[checkId]) showToast("✅", el.querySelector(".step-title").textContent + " — Done!");
}

function loadChecklist() {
  ["chk-email","chk-bank","chk-social","chk-work","chk-backup"].forEach(id => {
    const el = document.getElementById(id);
    if (el && completedSteps[id]) el.classList.add("done");
  });
}

function updateChecklistProgress() {
  const ids = ["chk-email","chk-bank","chk-social","chk-work","chk-backup"];
  const done = ids.filter(id => {
    const el = document.getElementById(id);
    return el && el.classList.contains("done");
  }).length;
  const el = document.getElementById("checklist-progress");
  if (el) {
    el.textContent = `${done} / ${ids.length} completed`;
    el.style.color = done === ids.length ? "var(--green)" : "var(--text2)";
  }
  if (done === ids.length) {
    showToast("🎉","Excellent! All accounts are 2FA protected!");
  }
}

function resetChecklist() {
  ["chk-email","chk-bank","chk-social","chk-work","chk-backup"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove("done"); delete completedSteps[id]; }
  });
  Storage.set(CHECKLIST_KEY, completedSteps);
  updateChecklistProgress();
  showToast("↺","Checklist reset.");
}
