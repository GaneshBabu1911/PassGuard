"use strict";
/* dashboard.js — Analytics dashboard */

const LEVEL_CONFIG = {
  "Very Strong": { color: "var(--cyan)",   bg: "rgba(6,182,212,.8)" },
  "Strong":      { color: "var(--green)",  bg: "rgba(16,185,129,.8)" },
  "Medium":      { color: "var(--amber)",  bg: "rgba(245,158,11,.8)" },
  "Weak":        { color: "var(--orange)", bg: "rgba(249,115,22,.8)" },
  "Very Weak":   { color: "var(--red)",    bg: "rgba(239,68,68,.8)" },
};

document.addEventListener("DOMContentLoaded", () => {
  injectNav("dashboard");
  renderDashboard();
});

function renderDashboard() {
  const hist = getHistory();

  if (!hist.length) return;

  // Stats
  const total  = hist.length;
  const passed = hist.filter(h => h.valid).length;
  const avg    = Math.round(hist.reduce((a,h)=>a+h.score,0)/total);
  const high   = Math.max(...hist.map(h=>h.score));
  const low    = Math.min(...hist.map(h=>h.score));

  document.getElementById("d-total").textContent = total;
  document.getElementById("d-total-sub").textContent = `Last: ${fmtDate(hist[0].ts)}`;
  document.getElementById("d-pass").textContent  = Math.round(passed/total*100) + "%";
  document.getElementById("d-pass-sub").textContent = `${passed} of ${total} passed`;
  document.getElementById("d-avg").textContent   = avg;
  document.getElementById("d-high").textContent  = high;
  document.getElementById("d-low").textContent   = low;

  // Most common level
  const levelCount = {};
  hist.forEach(h => levelCount[h.level] = (levelCount[h.level]||0)+1);
  const common = Object.entries(levelCount).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById("d-common").textContent = common ? common[0] : "—";

  // Distribution chart
  renderDistChart(hist, total);

  // Posture ring
  renderPostureRing(avg);

  // Trend
  renderTrend(hist);

  // Recent
  renderRecent(hist.slice(0, 8));
}

function renderDistChart(hist, total) {
  const el    = document.getElementById("dist-chart");
  const empty = document.getElementById("dist-empty");
  const levels = ["Very Strong","Strong","Medium","Weak","Very Weak"];
  const counts = {};
  hist.forEach(h => counts[h.level] = (counts[h.level]||0)+1);
  const hasData = levels.some(l => counts[l]);
  if (!hasData) return;
  empty.style.display = "none";

  el.innerHTML = levels.map(l => {
    const c   = counts[l] || 0;
    const pct = total ? Math.round(c/total*100) : 0;
    const cfg = LEVEL_CONFIG[l];
    return `
      <div class="bar-row">
        <span class="bar-label" style="color:${cfg.color}">${l}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%;background:${cfg.bg}" data-target="${pct}"></div>
        </div>
        <span class="bar-count">${c}</span>
      </div>`;
  }).join("");

  // Animate bars
  requestAnimationFrame(() => {
    el.querySelectorAll(".bar-fill").forEach(b => {
      b.style.width = "0%";
      setTimeout(() => b.style.width = b.dataset.target + "%", 100);
    });
  });
}

function renderPostureRing(avg) {
  const C = 2 * Math.PI * 62;
  const ring = document.getElementById("posture-ring");
  const num  = document.getElementById("posture-num");
  const adv  = document.getElementById("posture-advice");

  const color = avg >= 90 ? "var(--cyan)" : avg >= 75 ? "var(--green)"
    : avg >= 60 ? "var(--amber)" : avg >= 40 ? "var(--orange)" : "var(--red)";

  ring.style.strokeDashoffset = C - (avg/100)*C;
  ring.style.stroke = color;
  num.textContent = avg;
  num.style.color = color;

  adv.textContent = avg >= 90 ? "🛡️ Excellent posture — consistently strong passwords!"
    : avg >= 75 ? "👍 Good posture — keep aiming for 'Very Strong'."
    : avg >= 60 ? "📈 Fair posture — consider enabling stricter policy rules."
    : avg >= 40 ? "⚠️ Weak posture — many passwords are failing. Use the generator!"
    : "🚨 Critical posture — most passwords are very weak.";
}

function renderTrend(hist) {
  const canvas = document.getElementById("trend-canvas");
  const empty  = document.getElementById("trend-empty");
  if (hist.length < 3) { canvas.style.display="none"; return; }

  empty.style.display = "none";
  canvas.style.display = "block";

  const ctx = canvas.getContext("2d");
  const W   = canvas.width, H = canvas.height;
  const pts = hist.slice(0, 30).reverse(); // oldest first, max 30
  const scores = pts.map(p => p.score);
  const minS = Math.max(0, Math.min(...scores) - 10);
  const maxS = Math.min(100, Math.max(...scores) + 10);
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";

  ctx.clearRect(0, 0, W, H);

  const pad = { l:30, r:20, t:20, b:30 };
  const gw  = W - pad.l - pad.r;
  const gh  = H - pad.t - pad.b;

  const x = i => pad.l + (i / (pts.length-1)) * gw;
  const y = s => pad.t + (1 - (s-minS)/(maxS-minS)) * gh;

  // Grid lines
  ctx.strokeStyle = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)";
  ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(s => {
    const yy = y(s);
    ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(W-pad.r, yy); ctx.stroke();
    ctx.fillStyle = isDark ? "rgba(255,255,255,.25)" : "rgba(0,0,0,.35)";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.fillText(s, 2, yy + 4);
  });

  // Area fill
  const grad = ctx.createLinearGradient(0, pad.t, 0, H);
  grad.addColorStop(0, "rgba(139,92,246,.3)");
  grad.addColorStop(1, "rgba(139,92,246,.0)");
  ctx.beginPath();
  ctx.moveTo(x(0), y(scores[0]));
  scores.forEach((s, i) => { if (i > 0) ctx.lineTo(x(i), y(s)); });
  ctx.lineTo(x(scores.length-1), H - pad.b);
  ctx.lineTo(x(0), H - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.strokeStyle = "rgba(139,92,246,.9)";
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = "round";
  ctx.beginPath();
  scores.forEach((s, i) => i === 0 ? ctx.moveTo(x(i), y(s)) : ctx.lineTo(x(i), y(s)));
  ctx.stroke();

  // Dots
  scores.forEach((s, i) => {
    const col = s>=90?"#06b6d4":s>=75?"#10b981":s>=60?"#f59e0b":s>=40?"#f97316":"#ef4444";
    ctx.beginPath();
    ctx.arc(x(i), y(s), 4, 0, Math.PI*2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = isDark ? "#09090f" : "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function renderRecent(hist) {
  const list  = document.getElementById("recent-list");
  const empty = document.getElementById("recent-empty");
  if (!hist.length) return;
  empty.style.display = "none";

  const lc = {
    "Very Strong":"level-very-strong","Strong":"level-strong","Medium":"level-medium",
    "Weak":"level-weak","Very Weak":"level-very-weak"
  };

  list.innerHTML = hist.map(h => `
    <div class="flex items-center justify-between" style="padding:.45rem .65rem;border-radius:8px;background:var(--shimmer);border:1px solid var(--border)">
      <div class="flex items-center gap-2">
        <span style="font-size:1.1rem">${h.valid?"✅":"❌"}</span>
        <div>
          <div class="mono text-sm" style="font-weight:700;color:${h.score>=75?"var(--green)":h.score>=60?"var(--amber)":"var(--red)"}">${h.score}/100</div>
          <div class="text-xs text-muted">${h.length ? h.length+" chars" : ""}</div>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <span class="badge ${lc[h.level]||""}">${h.level}</span>
        <span class="text-xs text-muted">${fmtDate(h.ts)}</span>
      </div>
    </div>`).join("");
}
