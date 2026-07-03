/**
 * shared.js — Navigation injection, theme toggle, storage utils, toast, confetti
 * Loaded on every page FIRST.
 */
"use strict";

/* ── Theme ──────────────────────────────────────────────────────── */
const THEME_KEY = "pg_theme";
function getTheme() { return localStorage.getItem(THEME_KEY) || "dark"; }
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, t);
}
function toggleTheme() {
  applyTheme(getTheme() === "dark" ? "light" : "dark");
}

/* ── Navigation injection ───────────────────────────────────────── */
const NAV_LINKS = [
  { href: "index.html",     page: "index",     icon: "🔑", label: "Validator" },
  { href: "breach.html",    page: "breach",    icon: "🔍", label: "Breach Check" },
  { href: "generator.html", page: "generator", icon: "🎲", label: "Generator" },
  { href: "history.html",   page: "history",   icon: "📜", label: "History" },
  { href: "policy.html",    page: "policy",    icon: "⚙️",  label: "Policy" },
  { href: "dashboard.html", page: "dashboard", icon: "📊", label: "Dashboard" },
  { href: "twofa.html",     page: "twofa",     icon: "🛡️", label: "2FA Guide" },
];

function injectNav(activePage) {
  const linksHtml = NAV_LINKS.map(l =>
    `<a href="${l.href}" class="nav-link${l.page === activePage ? " active" : ""}" aria-label="${l.label}">
      <span aria-hidden="true">${l.icon}</span> ${l.label}
    </a>`
  ).join("");

  const mobileLinksHtml = NAV_LINKS.map(l =>
    `<a href="${l.href}" class="nav-link${l.page === activePage ? " active" : ""}">${l.icon} ${l.label}</a>`
  ).join("");

  const navHtml = `
<nav class="site-nav" role="navigation" aria-label="Main navigation">
  <a href="index.html" class="nav-logo" aria-label="PassGuard Home">
    <div class="nav-logo-icon" aria-hidden="true">🔐</div>
    <span class="nav-logo-text">PassGuard</span>
  </a>
  <div class="nav-links">${linksHtml}</div>
  <div class="nav-actions">
    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark/light mode" title="Toggle theme">☀️</button>
    <button class="nav-hamburger" id="nav-hamburger" aria-label="Open menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
<div class="nav-mobile-drawer" id="nav-drawer" role="menu">${mobileLinksHtml}</div>`;

  const mount = document.getElementById("nav-mount");
  if (mount) mount.innerHTML = navHtml;

  // Wire theme toggle
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  // Wire hamburger
  const ham = document.getElementById("nav-hamburger");
  const drawer = document.getElementById("nav-drawer");
  if (ham && drawer) {
    ham.addEventListener("click", () => {
      const open = drawer.classList.toggle("open");
      ham.setAttribute("aria-expanded", open);
    });
    // Close on outside click
    document.addEventListener("click", e => {
      if (!ham.contains(e.target) && !drawer.contains(e.target))
        drawer.classList.remove("open");
    });
  }
}

/* ── Toast ──────────────────────────────────────────────────────── */
function showToast(icon, message, duration = 3200) {
  let t = document.getElementById("pg-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "pg-toast"; t.className = "toast"; t.setAttribute("role", "alert");
    t.setAttribute("aria-live", "polite");
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), duration);
}

/* ── Confetti ───────────────────────────────────────────────────── */
function launchConfetti(count = 70) {
  let layer = document.querySelector(".confetti-layer");
  if (!layer) { layer = document.createElement("div"); layer.className = "confetti-layer"; document.body.appendChild(layer); }
  const colors = ["#7c3aed","#ec4899","#06b6d4","#10b981","#f59e0b","#f97316","#6366f1"];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement("div");
      el.className = "cp";
      el.style.cssText = `
        left:${Math.random()*100}%; top:-12px;
        width:${Math.random()*7+4}px; height:${Math.random()*7+4}px;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        border-radius:${Math.random()>.5?"50%":"2px"};
        animation-duration:${Math.random()*2+2.5}s;
        animation-delay:0s;`;
      layer.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    }, i * 28);
  }
}

/* ── Storage helpers ────────────────────────────────────────────── */
const Storage = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
  remove(key) { try { localStorage.removeItem(key); } catch {} }
};

/* ── History helpers ────────────────────────────────────────────── */
const HIST_KEY = "pg_history";
const HIST_MAX = 100;
function addToHistory(entry) {
  const hist = Storage.get(HIST_KEY, []);
  hist.unshift({ ...entry, ts: Date.now() });
  if (hist.length > HIST_MAX) hist.pop();
  Storage.set(HIST_KEY, hist);
}
function getHistory() { return Storage.get(HIST_KEY, []); }
function clearHistory() { Storage.remove(HIST_KEY); }

/* ── Policy helpers ─────────────────────────────────────────────── */
const POLICY_KEY = "pg_policy";
const DEFAULT_POLICY = {
  minLength: 12, requireUpper: true, requireLower: true,
  requireDigit: true, requireSymbol: true,
  maxRepeated: 3, bannedWords: []
};
function getPolicy() { return { ...DEFAULT_POLICY, ...Storage.get(POLICY_KEY, {}) }; }
function savePolicy(p) { Storage.set(POLICY_KEY, p); }

/* ── Strength meta ──────────────────────────────────────────────── */
const STRENGTH_META = {
  "Very Weak":   { cls: "level-very-weak",   color: "#ef4444", pct: 10 },
  "Weak":        { cls: "level-weak",        color: "#f97316", pct: 30 },
  "Medium":      { cls: "level-medium",      color: "#f59e0b", pct: 55 },
  "Strong":      { cls: "level-strong",      color: "#10b981", pct: 80 },
  "Very Strong": { cls: "level-very-strong", color: "#06b6d4", pct: 100 },
};

/* ── Animate counter ────────────────────────────────────────────── */
function animCount(el, from, to, dur = 450) {
  const s = performance.now();
  const tick = now => {
    const p = Math.min((now - s) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ── Format date ────────────────────────────────────────────────── */
function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ── Init on every page ─────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(getTheme());
});
