"use strict";
/* generator.js — EFF-wordlist passphrase generator */

// Curated 512-word EFF-style list
const WORDS = [
"abacus","abandon","abbey","ability","above","absent","absorb","abuse","abyss","accent",
"accept","access","account","achieve","acquire","actor","adapt","address","adjust","admit",
"advance","advent","advice","affair","affect","afford","afraid","agenda","agent","agree",
"album","alert","alien","align","almond","alpine","alter","amaze","amber","amble",
"anchor","angle","animal","answer","anvil","apart","apple","apply","arctic","argue",
"arrow","assist","atlas","attic","audio","audit","avail","award","aware","awful",
"bacon","badge","balance","ballot","bamboo","basket","battle","beach","began","believe",
"below","bench","berry","better","beyond","billion","bishop","blanket","blend","bliss",
"block","bloom","borrow","bounce","branch","brave","breath","brick","bridge","bright",
"broken","bruise","budget","build","bundle","burrow","butter","button","cabin","cable",
"candle","canyon","captain","carbon","castle","catch","cause","cedar","center","chain",
"chalk","change","chapel","charge","circle","circuit","claim","classic","clever","climate",
"cloud","coach","cobalt","coffee","comet","common","coral","corner","cotton","cover",
"cradle","credit","creek","crisp","cross","crown","cruise","custom","dance","danger",
"daring","dawn","debate","decide","defend","define","deliver","delta","dense","design",
"detail","device","devote","differ","direct","discard","discover","distant","divide","dizzy",
"donate","double","draft","drape","dream","drive","durable","earth","easy","eclipse",
"effort","either","elegant","element","emerge","empire","enable","engine","enough","enter",
"equal","escape","estate","event","evolve","expand","export","extend","fabric","falcon",
"family","fathom","fetch","fever","fiber","field","figure","filter","final","finish",
"fjord","flame","flare","flight","floor","flower","focus","forest","forget","formal",
"fossil","fragile","frame","fresh","frozen","fruit","future","galaxy","garden","gentle",
"genuine","glacier","glory","govern","grade","grant","graph","gravel","great","green",
"grove","growth","guide","guitar","harbor","harvest","heavy","helpful","herbal","hidden",
"highly","hinge","hollow","honest","honey","honor","humble","hunter","hybrid","ideal",
"ignore","image","impact","improve","income","infant","island","jacket","jaguar","jewel",
"journey","judge","jungle","just","kayak","kernel","kingdom","kneel","knot","labor",
"ladder","launch","layer","leaf","learn","ledge","legend","length","level","light",
"limit","lively","local","logic","lunar","luster","magic","manage","marble","margin",
"market","master","match","matter","meadow","memory","mental","method","middle","million",
"mirror","mobile","modern","modest","moment","motion","motive","mount","muscle","nature",
"nearby","needle","neutral","night","noble","north","notice","novel","number","oblong",
"obtain","offer","offset","often","olive","option","orbit","order","origin","output",
"outward","owner","oxygen","paddle","panel","paper","patrol","pattern","pause","peace",
"pencil","pepper","permit","phrase","pilot","pioneer","pivot","planet","plank","pliant",
"pocket","point","polish","pond","popular","porter","poster","power","praise","prefer",
"prince","print","process","protect","proud","prove","public","purple","puzzle","quality",
"quiet","quota","rabbit","radar","radius","raise","rapid","raven","reach","ready",
"reason","rebuild","record","reduce","reform","region","remain","remote","repeat","rescue",
"resolve","result","return","river","robust","rocket","rocky","rotate","round","route",
"royal","rugby","rustic","sample","scale","scene","scrub","search","second","secure",
"segment","sense","serial","serve","settle","shadow","shape","share","shift","signal",
"silver","simple","single","skill","slate","slope","smart","smooth","solar","solve",
"source","south","space","spark","speed","spiral","spirit","splash","spring","stable",
"stack","start","steady","stone","storm","story","stream","strict","strong","study",
"sunny","surge","survey","sustain","table","talent","target","team","theory","timber",
"toggle","total","touch","tower","trade","travel","trend","trial","triple","trophy",
"trust","under","unique","update","urban","usher","value","vector","velvet","vessel",
"vision","vital","vocal","volume","voyage","warden","water","welcome","whole","width",
"window","winter","wisdom","wonder","workshop","worth","yellow","yield","zenith","zero"
];

const SYMS = "!@#$%&*?";
const GEN_HIST_KEY = "pg_gen_hist";

let currentPhrase = "";
let genHistory = Storage.get(GEN_HIST_KEY, []);

document.addEventListener("DOMContentLoaded", () => {
  injectNav("generator");

  const wc = document.getElementById("word-count");
  wc.addEventListener("input", () => {
    document.getElementById("word-count-val").textContent = wc.value;
  });

  document.getElementById("gen-btn").addEventListener("click", generate);
  document.getElementById("copy-btn").addEventListener("click", copyPhrase);
  document.getElementById("copy-btn-2").addEventListener("click", copyPhrase);
  document.getElementById("use-btn").addEventListener("click", useInValidator);
  document.getElementById("clear-gen-hist").addEventListener("click", () => {
    genHistory = []; Storage.set(GEN_HIST_KEY, []);
    renderGenHistory();
    showToast("🗑️","History cleared.");
  });

  renderGenHistory();
  generate(); // auto-generate on load
});

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generate() {
  const wc  = parseInt(document.getElementById("word-count").value);
  const sep = document.getElementById("separator").value;
  const addNum  = document.getElementById("add-num").checked;
  const addSym  = document.getElementById("add-sym").checked;
  const cap     = document.getElementById("capitalise").checked;
  const mixNums = document.getElementById("mix-nums").checked;

  const leet = { a:"@", e:"3", i:"1", o:"0", s:"5" };

  let words = Array.from({length: wc}, () => {
    let w = rand(WORDS);
    if (mixNums && Math.random() < 0.4) {
      const pos = randInt(1, w.length - 1);
      w = w.slice(0,pos) + randInt(1,9) + w.slice(pos);
    }
    return cap ? w[0].toUpperCase() + w.slice(1) : w;
  });

  let parts = [...words];
  if (addNum) parts.push(String(randInt(10,999)));
  if (addSym) parts.push(rand([...SYMS]));

  currentPhrase = parts.join(sep);
  renderPhrase(words, sep, addNum ? String(randInt(10,999)) : null, addSym ? rand([...SYMS]) : null, parts);
  updateEntropy(currentPhrase, wc);

  genHistory.unshift({ phrase: currentPhrase, ts: Date.now() });
  if (genHistory.length > 30) genHistory.pop();
  Storage.set(GEN_HIST_KEY, genHistory);
  renderGenHistory();
}

function renderPhrase(words, sep, num, sym, all) {
  const el = document.getElementById("phrase-display");
  const colors = words.map((_, i) => i % 6);

  let html = words.map((w, i) =>
    `<span class="word-pill word-pill-${i%6}">${w}</span>` +
    (i < words.length - 1 || num || sym ? `<span class="sep-pill">${sep || ""}</span>` : "")
  ).join("");

  if (num) html += `<span class="word-pill word-pill-3">${num}</span>`;
  if (num && sym) html += `<span class="sep-pill">${sep||""}</span>`;
  if (sym) html += `<span class="word-pill word-pill-1">${sym}</span>`;

  el.innerHTML = html || `<span>${currentPhrase}</span>`;
  el.classList.add("highlight");
  setTimeout(() => el.classList.remove("highlight"), 400);
}

function updateEntropy(phrase, wordCount) {
  // Entropy from word selection: log2(512^wordCount) + bonus for extras
  const wordEntropy   = Math.round(wordCount * Math.log2(WORDS.length));
  const totalLen      = phrase.length;
  let pool = 26;
  if (/[A-Z]/.test(phrase)) pool += 26;
  if (/[0-9]/.test(phrase)) pool += 10;
  if (/[^A-Za-z0-9]/.test(phrase)) pool += 32;
  const charEntropy = Math.round(totalLen * Math.log2(pool));

  // We show word-based entropy as primary
  const bits = wordEntropy;
  const pct  = Math.min(bits / 128 * 100, 100);

  document.getElementById("entr-val").textContent = `~${bits} bits`;
  const fill = document.getElementById("entr-fill");
  fill.style.width = pct + "%";
  fill.style.background = bits < 40 ? `linear-gradient(90deg,var(--red)99,var(--red))`
    : bits < 60 ? `linear-gradient(90deg,var(--amber)99,var(--amber))`
    : bits < 80 ? `linear-gradient(90deg,var(--green)99,var(--green))`
    : `linear-gradient(90deg,var(--cyan)99,var(--cyan))`;

  const advice = bits < 40 ? "Add more words for stronger security."
    : bits < 60 ? "Good entropy — suitable for most accounts."
    : bits < 80 ? "Strong entropy — suitable for sensitive accounts."
    : "Excellent entropy — near impossible to brute-force.";
  document.getElementById("entr-advice").textContent = advice;

  document.getElementById("entr-details").innerHTML = `
    <div class="flex items-center justify-between" style="padding:.4rem .6rem;background:var(--shimmer);border-radius:6px;border:1px solid var(--border)">
      <span class="text-xs text-muted">Word selection entropy</span>
      <span class="mono text-xs" style="color:var(--violet)">${bits} bits (log₂(${WORDS.length}^${wordCount}))</span>
    </div>
    <div class="flex items-center justify-between" style="padding:.4rem .6rem;background:var(--shimmer);border-radius:6px;border:1px solid var(--border)">
      <span class="text-xs text-muted">Character-based entropy</span>
      <span class="mono text-xs" style="color:var(--cyan)">${charEntropy} bits (length ${totalLen}, pool ${pool})</span>
    </div>
    <div class="flex items-center justify-between" style="padding:.4rem .6rem;background:var(--shimmer);border-radius:6px;border:1px solid var(--border)">
      <span class="text-xs text-muted">Estimated crack time (GPU)</span>
      <span class="mono text-xs" style="color:var(--green)">${crackTime(bits)}</span>
    </div>`;
}

function crackTime(bits) {
  // Assume 10^12 guesses/sec (modern GPU rig)
  const guesses = Math.pow(2, bits);
  const sec = guesses / 1e12;
  if (sec < 60) return `${sec.toFixed(0)}s`;
  if (sec < 3600) return `${(sec/60).toFixed(0)} minutes`;
  if (sec < 86400) return `${(sec/3600).toFixed(0)} hours`;
  if (sec < 31536000) return `${(sec/86400).toFixed(0)} days`;
  if (sec < 31536000*1000) return `${(sec/31536000).toFixed(0)} years`;
  return `${(sec/31536000/1e9).toExponential(1)} billion years`;
}

async function copyPhrase() {
  if (!currentPhrase) { showToast("⚠️","Generate a passphrase first!"); return; }
  try {
    await navigator.clipboard.writeText(currentPhrase);
    showToast("📋","Passphrase copied to clipboard!");
  } catch {
    showToast("❌","Clipboard access denied.");
  }
}

function useInValidator() {
  if (!currentPhrase) { generate(); return; }
  sessionStorage.setItem("pg_fill_pw", currentPhrase);
  window.location.href = "index.html";
}

function renderGenHistory() {
  const el    = document.getElementById("gen-history");
  const empty = document.getElementById("gen-empty");
  if (!genHistory.length) { el.innerHTML=""; el.appendChild(empty); empty.style.display="flex"; return; }
  empty.style.display = "none";
  el.innerHTML = genHistory.map(h => `
    <div class="flex items-center justify-between" style="padding:.45rem .7rem;border-radius:8px;background:var(--shimmer);border:1px solid var(--border);gap:.5rem">
      <span class="mono text-sm" style="color:var(--text2);word-break:break-all;flex:1">${h.phrase}</span>
      <div class="flex gap-1" style="flex-shrink:0">
        <button class="btn btn-secondary btn-sm" onclick="copyDirect('${h.phrase.replace(/'/g,"\\'")}')">📋</button>
        <span class="text-xs text-muted">${fmtDate(h.ts)}</span>
      </div>
    </div>`).join("");
}

function copyDirect(phrase) {
  navigator.clipboard.writeText(phrase).then(() => showToast("📋","Copied!")).catch(() => showToast("❌","Clipboard denied."));
}

// Pre-fill from validator page
document.addEventListener("DOMContentLoaded", () => {
  const fill = sessionStorage.getItem("pg_fill_pw");
  if (fill) { sessionStorage.removeItem("pg_fill_pw"); }
});
