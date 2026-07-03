"use strict";
/* app.js — Main validator page logic */

const RULES_DEF = [
  { key: "length",       label: "Minimum length met",           icon: "📏" },
  { key: "hasUpper",     label: "Uppercase letter (A–Z)",       icon: "🔠" },
  { key: "hasLower",     label: "Lowercase letter (a–z)",       icon: "🔡" },
  { key: "hasDigit",     label: "Contains a digit (0–9)",       icon: "🔢" },
  { key: "hasSymbol",    label: "Special character (!@#$…)",    icon: "🔣" },
  { key: "notBanned",    label: "Not a common password",        icon: "🚫" },
  { key: "noUsername",   label: "Doesn't contain username",     icon: "👤" },
  { key: "noRepeated",   label: "No repeated chars (aaa, 111)",icon: "♾️" },
  { key: "noSequential", label: "No sequential chars (abc)",    icon: "↗️" },
  { key: "noCommonSeq",  label: "No keyboard seq (qwerty)",    icon: "⌨️" },
];

let pwVisible = false;
let debounceT = null;
let confettiFired = false;

document.addEventListener("DOMContentLoaded", () => {
  injectNav("index");
  buildChecklist();
  updatePolicyIndicator();

  const pwEl   = document.getElementById("password");
  const unEl   = document.getElementById("username");
  const visBtn = document.getElementById("vis-btn");
  const valBtn = document.getElementById("validate-btn");

  pwEl.addEventListener("input", onInput);
  unEl.addEventListener("input", onInput);
  valBtn.addEventListener("click", handleValidate);
  pwEl.addEventListener("keydown", e => { if (e.key === "Enter") handleValidate(); });
  unEl.addEventListener("keydown", e => { if (e.key === "Enter") pwEl.focus(); });

  visBtn.addEventListener("click", () => {
    pwVisible = !pwVisible;
    pwEl.type = pwVisible ? "text" : "password";
    visBtn.innerHTML = pwVisible
      ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/></svg>`
      : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });
});

function buildChecklist() {
  const ul = document.getElementById("checklist");
  const policy = getPolicy();
  ul.innerHTML = "";
  RULES_DEF.forEach(r => {
    // Hide rule if policy disables it
    if (r.key === "hasUpper"  && !policy.requireUpper)  return;
    if (r.key === "hasLower"  && !policy.requireLower)  return;
    if (r.key === "hasDigit"  && !policy.requireDigit)  return;
    if (r.key === "hasSymbol" && !policy.requireSymbol) return;
    const li = document.createElement("li");
    li.className = "check-item fail"; li.id = `chk-${r.key}`;
    li.innerHTML = `<span class="check-dot">✕</span><span>${r.icon} ${r.key === "length" ? `At least ${policy.minLength} characters` : r.label}</span>`;
    ul.appendChild(li);
  });
}

function updatePolicyIndicator() {
  const p = getPolicy();
  const el = document.getElementById("policy-indicator");
  if (!el) return;
  const isCustom = JSON.stringify(p) !== JSON.stringify({
    minLength:12,requireUpper:true,requireLower:true,requireDigit:true,
    requireSymbol:true,maxRepeated:3,bannedWords:[]
  });
  el.textContent = isCustom ? "⚙️ Custom policy" : "Default policy";
}

function onInput() {
  clearTimeout(debounceT);
  const pw = document.getElementById("password").value;
  const un = document.getElementById("username").value;
  if (!pw) { resetUI(); return; }
  updateEntropyHint(pw);
  debounceT = setTimeout(() => {
    const res = validatePassword(un, pw);
    updateChecklist(res.details);
    updateMeter(res.score, res.level);
    updateRing(res.score, res.level);
  }, 250);
}

function updateEntropyHint(pw) {
  const el = document.getElementById("entropy-hint");
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10; if (/[^A-Za-z0-9]/.test(pw)) pool += 32;
  const bits = pool > 0 ? Math.round(pw.length * Math.log2(pool)) : 0;
  el.textContent = `${pw.length} chars · ~${bits} bits entropy`;
  el.style.opacity = "1";
}

function updateChecklist(details) {
  Object.keys(details).forEach(key => {
    const el = document.getElementById(`chk-${key}`);
    if (!el) return;
    const pass = details[key] === true;
    el.className = `check-item ${pass ? "pass" : "fail"}`;
    el.querySelector(".check-dot").textContent = pass ? "✓" : "✕";
  });
}

function updateMeter(score, level) {
  const meta = STRENGTH_META[level] || STRENGTH_META["Very Weak"];
  const badge = document.getElementById("str-badge");
  const fill  = document.getElementById("str-fill");
  const num   = document.getElementById("str-score");
  badge.textContent = level;
  badge.className = `str-badge ${meta.cls}`;
  fill.style.width = `${Math.max(score,2)}%`;
  fill.style.background = `linear-gradient(90deg,${meta.color}99,${meta.color})`;
  animCount(num, parseInt(num.dataset.v||0), score);
  num.dataset.v = score;
  num.style.color = meta.color;
}

function updateRing(score, level) {
  const meta = STRENGTH_META[level] || STRENGTH_META["Very Weak"];
  const circ = document.getElementById("ring-circle");
  const num  = document.getElementById("ring-num");
  if (!circ) return;
  const C = 2 * Math.PI * 52;
  circ.style.strokeDasharray  = C;
  circ.style.strokeDashoffset = C - (score/100)*C;
  circ.style.stroke = meta.color;
  num.textContent = score;
  num.style.color = meta.color;
}

async function handleValidate() {
  const pw = document.getElementById("password").value;
  const un = document.getElementById("username").value;
  if (!pw) { showToast("⚠️","Enter a password first."); return; }

  setLoading(true);
  const res = await fetchValidate(un, pw);
  setLoading(false);

  renderResult(res);
  addToHistory({ score: res.score, level: res.level, valid: res.valid, length: pw.length });

  if (res.valid && res.score >= 90 && !confettiFired) {
    confettiFired = true;
    launchConfetti();
    showToast("🎉","Very Strong password! Excellent!");
  } else if (res.valid) {
    showToast("✅","Password meets all requirements!");
  }
}

async function fetchValidate(un, pw) {
  try {
    const r = await fetch("/api/validate", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ username: un, password: pw }),
      signal: AbortSignal.timeout(4000)
    });
    if (r.ok) return await r.json();
  } catch {}
  // Offline fallback
  return validatePassword(un, pw);
}

function renderResult(res) {
  const bar  = document.getElementById("result-bar");
  const icon = document.getElementById("res-icon");
  const head = document.getElementById("res-head");
  const sub  = document.getElementById("res-sub");
  const panel= document.getElementById("result-panel");

  if (res.valid) {
    bar.className="result-bar ok"; icon.textContent="✅";
    head.textContent="Password Accepted!";
    sub.textContent="Meets all enterprise security requirements.";
  } else {
    bar.className="result-bar bad"; icon.textContent="❌";
    head.textContent="Password Rejected";
    sub.textContent=`${res.feedback.length} issue${res.feedback.length!==1?"s":""} to fix`;
  }

  updateMeter(res.score, res.level);
  updateRing(res.score, res.level);

  const ent = document.getElementById("ring-entropy");
  if (ent && res.details) ent.textContent = `Entropy: ~${res.details.entropy} bits`;

  // Chips
  const cg = document.getElementById("chips-grid");
  cg.innerHTML = "";
  const chipDefs = [
    ["length","Length OK"],["hasUpper","Uppercase"],["hasLower","Lowercase"],
    ["hasDigit","Digit"],["hasSymbol","Symbol"],["notBanned","Not Common"],
    ["noUsername","No Username"],["noRepeated","No Repeats"],
    ["noSequential","No Seqs"],["noCommonSeq","No KB Seq"]
  ];
  chipDefs.forEach(([k,l]) => {
    if (res.details[k] === undefined) return;
    const d = document.createElement("div");
    d.className = `chip ${res.details[k] ? "pass" : "fail"}`;
    d.innerHTML = `<span>${res.details[k]?"✓":"✕"}</span><span>${l}</span>`;
    cg.appendChild(d);
  });

  // Feedback
  const fl = document.getElementById("fb-list");
  fl.innerHTML = "";
  if (res.feedback.length === 0) {
    fl.innerHTML = `<li class="fb-item" style="background:rgba(16,185,129,.06);border-color:rgba(16,185,129,.2)"><span class="fb-icon">🎉</span><span>All requirements passed!</span></li>`;
  } else {
    res.feedback.forEach((m, i) => {
      const li = document.createElement("li");
      li.className="fb-item"; li.style.animationDelay=`${i*55}ms`;
      li.innerHTML=`<span class="fb-icon">⚠️</span><span>${m}</span>`;
      fl.appendChild(li);
    });
  }

  panel.classList.add("show");
  panel.scrollIntoView({ behavior:"smooth", block:"nearest" });
}

function resetUI() {
  document.getElementById("entropy-hint").style.opacity="0";
  document.getElementById("str-badge").textContent="—";
  document.getElementById("str-badge").className="str-badge";
  document.getElementById("str-fill").style.width="0%";
  document.getElementById("str-score").textContent="0";
  updateRing(0,"Very Weak");
  document.querySelectorAll(".check-item").forEach(el => {
    el.className="check-item fail";
    el.querySelector(".check-dot").textContent="✕";
  });
  document.getElementById("result-panel").classList.remove("show");
  confettiFired = false;
}

function setLoading(on) {
  const btn = document.getElementById("validate-btn");
  const sp  = document.getElementById("btn-spin");
  const lbl = document.getElementById("btn-lbl");
  btn.disabled = on;
  sp.style.display  = on ? "block" : "none";
  lbl.style.opacity = on ? "0" : "1";
}
