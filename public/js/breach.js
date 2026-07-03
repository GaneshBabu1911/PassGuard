"use strict";
/* breach.js — HaveIBeenPwned k-anonymity breach checker */

const BATCH_KEY = "pg_breach_batch";
let batchHistory = Storage.get(BATCH_KEY, []);
let pwVisible = false;

document.addEventListener("DOMContentLoaded", () => {
  injectNav("breach");
  renderBatch();

  document.getElementById("bc-btn").addEventListener("click", checkBreach);
  document.getElementById("bc-pw").addEventListener("keydown", e => {
    if (e.key === "Enter") checkBreach();
  });
  document.getElementById("bc-vis").addEventListener("click", () => {
    pwVisible = !pwVisible;
    const inp = document.getElementById("bc-pw");
    inp.type = pwVisible ? "text" : "password";
    document.getElementById("bc-vis").innerHTML = pwVisible
      ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/></svg>`
      : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });
});

async function sha1(str) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("").toUpperCase();
}

async function checkBreach() {
  const pw = document.getElementById("bc-pw").value;
  if (!pw) { showToast("⚠️","Enter a password to check."); return; }

  setLoading(true);
  hideAll();

  try {
    const hash   = await sha1(pw);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    // Show hash preview
    const hp = document.getElementById("hash-preview");
    const hd = document.getElementById("hash-display");
    hp.style.display = "block";
    hd.textContent =
      `Full SHA-1:  ${hash}\nSent to API: ${prefix}... (5 chars only)\nChecked:     ${suffix} (never sent)`;

    const resp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" }
    });

    if (!resp.ok) throw new Error(`HIBP API error: ${resp.status}`);

    const text = await resp.text();
    let count  = 0;

    for (const line of text.split("\n")) {
      const [h, c] = line.trim().split(":");
      if (h && h.toUpperCase() === suffix) { count = parseInt(c) || 0; break; }
    }

    const entry = { pw: pw.slice(0,2)+"*".repeat(Math.max(0,pw.length-2)), count, ts: Date.now() };
    batchHistory.unshift(entry);
    if (batchHistory.length > 20) batchHistory.pop();
    Storage.set(BATCH_KEY, batchHistory);
    renderBatch();

    if (count === 0) {
      document.getElementById("bc-safe").classList.add("show");
      showToast("✅","Good news — not found in any breach!");
    } else {
      document.getElementById("bc-pwned").classList.add("show");
      const cntEl = document.getElementById("bc-count");
      animCount(cntEl, 0, count, 1200);
      document.getElementById("bc-advice").textContent =
        count > 100000
          ? `🚨 Critical! This password was breached ${count.toLocaleString()} times. Change it immediately on every site you use it.`
          : count > 1000
          ? `⚠️ This password was exposed ${count.toLocaleString()} times. You should change it right away.`
          : `⚠️ Found ${count.toLocaleString()} time${count===1?"":"s"} in breach databases. Consider changing it.`;
      showToast("🚨","Password found in breach database!");
    }
  } catch (err) {
    showToast("❌", err.message.includes("Failed to fetch")
      ? "Network error — check your internet connection."
      : `Error: ${err.message}`);
    document.getElementById("hash-preview").style.display = "none";
  } finally {
    setLoading(false);
  }
}

function hideAll() {
  ["bc-idle","bc-safe","bc-pwned"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("show");
    if (el) el.style.display = "";
  });
  document.getElementById("bc-idle").style.display = "none";
}

function setLoading(on) {
  const btn = document.getElementById("bc-btn");
  const sp  = document.getElementById("bc-spin");
  const lbl = document.getElementById("bc-lbl");
  btn.disabled = on;
  sp.style.display  = on ? "block" : "none";
  lbl.style.opacity = on ? "0" : "1";
  if (on) lbl.textContent = "Checking…";
  else    lbl.textContent = "🔍 Check for Breaches";
}

function renderBatch() {
  const list  = document.getElementById("batch-list");
  const empty = document.getElementById("batch-empty");
  if (!batchHistory.length) { list.innerHTML=""; empty.style.display="block"; return; }
  empty.style.display = "none";
  list.innerHTML = batchHistory.map(e => `
    <div class="flex items-center justify-between" style="padding:.5rem .75rem;border-radius:8px;background:var(--shimmer);border:1px solid var(--border)">
      <span class="mono text-sm" style="color:var(--text2)">${e.pw}</span>
      <div class="flex items-center gap-1">
        <span class="badge ${e.count===0?"badge-green":"badge-red"}">${e.count===0?"✅ Safe":"🚨 "+e.count.toLocaleString()}</span>
        <span class="text-xs text-muted">${fmtDate(e.ts)}</span>
      </div>
    </div>`).join("");
}
