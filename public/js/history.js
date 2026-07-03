"use strict";
/* history.js — Password validation history page */

document.addEventListener("DOMContentLoaded", () => {
  injectNav("history");
  render();

  document.getElementById("clear-hist-btn").addEventListener("click", () => {
    if (confirm("Clear all history? This cannot be undone.")) {
      clearHistory();
      render();
      showToast("🗑️", "History cleared.");
    }
  });

  document.getElementById("filter-level").addEventListener("change", render);
});

function render() {
  const hist   = getHistory();
  const filter = document.getElementById("filter-level").value;
  const filtered = filter === "all" ? hist : hist.filter(h => h.level === filter);

  // Stats
  if (hist.length) {
    document.getElementById("stat-total").textContent = hist.length;
    const passed = hist.filter(h => h.valid).length;
    document.getElementById("stat-pass").textContent = Math.round(passed/hist.length*100) + "%";
    const avg = Math.round(hist.reduce((a,h) => a+h.score,0)/hist.length);
    document.getElementById("stat-avg").textContent = avg;
  }

  const empty = document.getElementById("hist-empty");
  const table = document.getElementById("hist-table");
  const tbody = document.getElementById("hist-tbody");

  if (!filtered.length) {
    empty.style.display = "flex";
    table.style.display = "none";
    return;
  }
  empty.style.display = "none";
  table.style.display = "block";

  const levelClass = { "Very Strong":"level-very-strong","Strong":"level-strong","Medium":"level-medium","Weak":"level-weak","Very Weak":"level-very-weak" };

  tbody.innerHTML = filtered.map((h, i) => `
    <tr>
      <td class="text-muted mono">${i+1}</td>
      <td><span class="mono" style="font-weight:700;color:${scoreColor(h.score)}">${h.score}</span></td>
      <td><span class="badge ${levelClass[h.level]||""} ">${h.level}</span></td>
      <td class="mono">${h.length || "—"}</td>
      <td>${h.valid ? "<span class='badge badge-green'>✅ Pass</span>" : "<span class='badge badge-red'>❌ Fail</span>"}</td>
      <td class="text-muted text-sm">${fmtDate(h.ts)}</td>
    </tr>`).join("");
}

function scoreColor(s) {
  if (s>=90) return "var(--cyan)";
  if (s>=75) return "var(--green)";
  if (s>=60) return "var(--amber)";
  if (s>=40) return "var(--orange)";
  return "var(--red)";
}
