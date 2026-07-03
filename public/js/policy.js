"use strict";
/* policy.js — Policy configurator */

document.addEventListener("DOMContentLoaded", () => {
  injectNav("policy");
  loadPolicy();
  bindEvents();
  updatePreview();
});

function bindEvents() {
  ["min-len","max-rep","req-upper","req-lower","req-digit","req-sym","banned-words"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      const el = document.getElementById(id);
      if (el.type === "range") document.getElementById(id+"-val").textContent = el.value;
      updatePreview();
    });
  });
  document.getElementById("save-btn").addEventListener("click", saveCurrentPolicy);
  document.getElementById("reset-btn").addEventListener("click", resetPolicy);
}

function loadPolicy() {
  const p = getPolicy();
  document.getElementById("min-len").value       = p.minLength;
  document.getElementById("min-len-val").textContent = p.minLength;
  document.getElementById("max-rep").value       = p.maxRepeated;
  document.getElementById("max-rep-val").textContent = p.maxRepeated;
  document.getElementById("req-upper").checked   = p.requireUpper;
  document.getElementById("req-lower").checked   = p.requireLower;
  document.getElementById("req-digit").checked   = p.requireDigit;
  document.getElementById("req-sym").checked     = p.requireSymbol;
  document.getElementById("banned-words").value  = (p.bannedWords||[]).join("\n");
}

function currentValues() {
  return {
    minLength:      parseInt(document.getElementById("min-len").value),
    maxRepeated:    parseInt(document.getElementById("max-rep").value),
    requireUpper:   document.getElementById("req-upper").checked,
    requireLower:   document.getElementById("req-lower").checked,
    requireDigit:   document.getElementById("req-digit").checked,
    requireSymbol:  document.getElementById("req-sym").checked,
    bannedWords:    document.getElementById("banned-words").value.split("\n").map(w=>w.trim()).filter(Boolean)
  };
}

function updatePreview() {
  const p = currentValues();
  const reqs = [
    { label: `Minimum ${p.minLength} characters`, active: true },
    { label: "Uppercase letter (A–Z)", active: p.requireUpper },
    { label: "Lowercase letter (a–z)", active: p.requireLower },
    { label: "Digit (0–9)", active: p.requireDigit },
    { label: "Special character", active: p.requireSymbol },
    { label: `Max ${p.maxRepeated} repeated chars`, active: true },
    { label: "No sequential chars", active: true },
    { label: "No keyboard sequences", active: true },
    { label: `${(p.bannedWords||[]).length} custom banned word${p.bannedWords.length!==1?"s":""}`, active: p.bannedWords.length > 0 },
  ];
  document.getElementById("policy-preview").innerHTML = reqs.map(r => `
    <div class="check-item ${r.active?"pass":"fail"}">
      <span class="check-dot">${r.active?"✓":"✕"}</span>
      <span>${r.label}</span>
    </div>`).join("");

  // Score impact estimate
  let minPossible = 0;
  if (p.minLength <= 12) minPossible += 25;
  if (p.requireUpper)  minPossible += 15;
  if (p.requireLower)  minPossible += 15;
  if (p.requireDigit)  minPossible += 15;
  if (p.requireSymbol) minPossible += 15;
  minPossible += 15; // no repeated, no sequential, no username, not banned (bonus)

  const levels = [
    { lbl:"Very Strong", min:90, cls:"level-very-strong" },
    { lbl:"Strong",      min:75, cls:"level-strong" },
    { lbl:"Medium",      min:60, cls:"level-medium" },
    { lbl:"Weak",        min:40, cls:"level-weak" },
  ];
  document.getElementById("score-impact").innerHTML = levels.map(l => `
    <div class="flex items-center justify-between" style="padding:.4rem .65rem;border-radius:6px;background:var(--shimmer);border:1px solid var(--border)">
      <span class="badge ${l.cls}">${l.lbl}</span>
      <span class="text-sm text-muted">${minPossible >= l.min ? "✅ Achievable with this policy" : "⚠️ Stricter policy needed"}</span>
    </div>`).join("");
}

function saveCurrentPolicy() {
  const p = currentValues();
  savePolicy(p);
  showToast("💾","Policy saved successfully!");
  updatePreview();
}

function resetPolicy() {
  Storage.remove("pg_policy");
  loadPolicy();
  updatePreview();
  showToast("↺","Policy reset to defaults.");
}
