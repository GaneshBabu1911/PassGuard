/**
 * validator-core.js — Core password validation logic (shared across pages)
 * Reads from getPolicy() defined in shared.js
 */
"use strict";

const BANNED_PASSWORDS = new Set([
  "password","password123","admin","welcome","qwerty","letmein","iloveyou",
  "123456","12345678","abc123","football","monkey","login","superman","batman",
  "master","dragon","princess","passw0rd","1q2w3e","sunshine","shadow",
  "123123","111111","000000","password1","123456789","1234567890","qwerty123",
  "hello","trustno1","654321","solo","starwars","cheese","cheese1","hunter2",
  "michael","jessica","andrew","joshua","1234","12345","pass","test","guest",
  "user","default","change","root","toor","alpine","changeme","cisco"
]);

const COMMON_SEQS = [
  "abcdefghijklmnopqrstuvwxyz","0123456789","qwertyuiop","asdfghjkl","zxcvbnm",
  "zyxwvutsrqponmlkjihgfedcba","9876543210","poiuytrewq","lkjhgfdsa","mnbvcxz"
];

const STRENGTH_LEVELS = [
  [90,"Very Strong"],[75,"Strong"],[60,"Medium"],[40,"Weak"],[0,"Very Weak"]
];

function strengthLevel(score) {
  for (const [min, lbl] of STRENGTH_LEVELS) if (score >= min) return lbl;
  return "Very Weak";
}

function validatePassword(username, password, customPolicy) {
  const policy = customPolicy || (typeof getPolicy === "function" ? getPolicy() : {
    minLength: 12, requireUpper: true, requireLower: true,
    requireDigit: true, requireSymbol: true, maxRepeated: 3, bannedWords: []
  });

  const result = {
    valid: false, score: 0, level: "Very Weak",
    feedback: [],
    details: {
      length: false, hasUpper: false, hasLower: false,
      hasDigit: false, hasSymbol: false, notBanned: true,
      noUsername: true, noRepeated: true, noSequential: true,
      noCommonSeq: true, entropy: 0
    }
  };

  if (!password) {
    result.feedback.push("Password cannot be empty.");
    return result;
  }
  if (password.length > 512) {
    result.feedback.push("Password exceeds max length.");
    return result;
  }

  // ── Character scan ────────────────────────────────────────────
  let hasUpper=false, hasLower=false, hasDigit=false, hasSymbol=false;
  let repeated=false, sequential=false, repeatCnt=1;

  for (let i = 0; i < password.length; i++) {
    const ch = password[i], code = password.charCodeAt(i);
    if      (ch >= 'A' && ch <= 'Z') hasUpper = true;
    else if (ch >= 'a' && ch <= 'z') hasLower = true;
    else if (ch >= '0' && ch <= '9') hasDigit = true;
    else if (!/\s/.test(ch))         hasSymbol = true;

    if (i > 0) {
      const prev = password.charCodeAt(i-1);
      if (code === prev) { repeatCnt++; if (repeatCnt >= policy.maxRepeated) repeated=true; }
      else repeatCnt = 1;

      if (i >= 2) {
        const p2 = password.charCodeAt(i-2);
        if ((p2+1===prev&&prev+1===code)||(p2-1===prev&&prev-1===code)) sequential=true;
      }
    }
  }

  const lp = password.toLowerCase();
  const lu = (username||"").toLowerCase().trim();
  const lengthOk   = password.length >= policy.minLength;
  const notBanned  = !BANNED_PASSWORDS.has(lp) &&
                     !(policy.bannedWords||[]).some(w => w && lp.includes(w.toLowerCase()));
  const noUsername = !lu || !lp.includes(lu);
  const noCommonSeq= !COMMON_SEQS.some(s => s.includes(lp) && lp.length >= 3);

  result.details.length      = lengthOk;
  result.details.hasUpper    = hasUpper;
  result.details.hasLower    = hasLower;
  result.details.hasDigit    = hasDigit;
  result.details.hasSymbol   = hasSymbol;
  result.details.notBanned   = notBanned;
  result.details.noUsername  = noUsername;
  result.details.noRepeated  = !repeated;
  result.details.noSequential= !sequential;
  result.details.noCommonSeq = noCommonSeq;

  // ── Feedback ─────────────────────────────────────────────────
  if (!lengthOk)       result.feedback.push(`Use at least ${policy.minLength} characters (currently ${password.length}).`);
  if (policy.requireUpper  && !hasUpper)  result.feedback.push("Add at least one uppercase letter (A–Z).");
  if (policy.requireLower  && !hasLower)  result.feedback.push("Add at least one lowercase letter (a–z).");
  if (policy.requireDigit  && !hasDigit)  result.feedback.push("Add at least one digit (0–9).");
  if (policy.requireSymbol && !hasSymbol) result.feedback.push("Add at least one special character (!@#$%^&*...).");
  if (!noUsername)     result.feedback.push("Password should not contain the username.");
  if (!notBanned)      result.feedback.push("This password is too common or organisation-banned.");
  if (!noCommonSeq)    result.feedback.push("Password contains a common keyboard sequence (qwerty, asdf…).");
  if (repeated)        result.feedback.push(`Avoid ${policy.maxRepeated}+ repeated characters like 'aaa' or '111'.`);
  if (sequential)      result.feedback.push("Avoid sequential characters like 'abcd' or '1234'.");

  // ── Score ─────────────────────────────────────────────────────
  let s = 0;
  if (lengthOk)                           s += 25;
  if (!policy.requireUpper  || hasUpper)  s += 15;
  if (!policy.requireLower  || hasLower)  s += 15;
  if (!policy.requireDigit  || hasDigit)  s += 15;
  if (!policy.requireSymbol || hasSymbol) s += 15;
  if (!repeated)    s += 5;
  if (!sequential)  s += 5;
  if (noUsername)   s += 5;
  if (notBanned)    s += 5;
  if (password.length >= 16) s = Math.min(s+5, 100);
  if (password.length >= 20) s = Math.min(s+5, 100);
  if (noCommonSeq)  s = Math.min(s+5, 100);

  result.score = Math.min(s, 100);
  result.level = strengthLevel(result.score);
  result.valid = result.feedback.length === 0;

  // ── Entropy ───────────────────────────────────────────────────
  let pool = 0;
  if (hasLower) pool += 26; if (hasUpper) pool += 26;
  if (hasDigit) pool += 10; if (hasSymbol) pool += 32;
  if (pool > 0) result.details.entropy = Math.round(password.length * Math.log2(pool));

  return result;
}
