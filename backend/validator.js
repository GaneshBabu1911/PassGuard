/**
 * Password Strength Validator - Core Logic
 * Faithfully ported from Java PasswordStrengthValidator.java
 */

"use strict";

const MIN_LENGTH = 12;

const BANNED_PASSWORDS = new Set([
  "password", "password123", "admin", "welcome", "qwerty",
  "letmein", "iloveyou", "123456", "12345678", "abc123",
  "football", "monkey", "login", "superman", "batman",
  "master", "dragon", "princess", "passw0rd", "1q2w3e",
  "sunshine", "shadow", "123123", "111111", "000000",
  "password1", "123456789", "1234567890", "qwerty123",
  "iloveyou", "hello", "trustno1", "654321", "jordan23",
  "harley", "ranger", "solo", "starwars", "cheese", "cheese1"
]);

const COMMON_SEQUENCES = [
  "abcdefghijklmnopqrstuvwxyz",
  "0123456789",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
  "zyxwvutsrqponmlkjihgfedcba",
  "9876543210",
  "poiuytrewq",
  "lkjhgfdsa",
  "mnbvcxz"
];

/**
 * Validate a password against enterprise security policy.
 * @param {string} username
 * @param {string} password
 * @returns {{ valid: boolean, score: number, level: string, feedback: string[], details: object }}
 */
function validate(username, password) {
  const result = {
    valid: false,
    score: 0,
    level: "Very Weak",
    feedback: [],
    details: {
      length: false,
      hasUpper: false,
      hasLower: false,
      hasDigit: false,
      hasSymbol: false,
      noRepeated: true,
      noSequential: true,
      noUsername: true,
      notBanned: true,
      noCommonSeq: true,
      entropy: 0
    }
  };

  if (!password || password.length === 0) {
    result.feedback.push("Password cannot be empty.");
    return result;
  }

  if (password.length > 512) {
    result.feedback.push("Password is too long (max 512 characters).");
    return result;
  }

  // ── Character analysis ─────────────────────────────────────────
  let hasUpper = false;
  let hasLower = false;
  let hasDigit = false;
  let hasSymbol = false;
  let repeatedChars = false;
  let sequentialChars = false;
  let repeatCount = 1;

  for (let i = 0; i < password.length; i++) {
    const ch = password[i];
    const code = password.charCodeAt(i);

    if (ch >= 'A' && ch <= 'Z') hasUpper = true;
    else if (ch >= 'a' && ch <= 'z') hasLower = true;
    else if (ch >= '0' && ch <= '9') hasDigit = true;
    else if (!/\s/.test(ch)) hasSymbol = true;

    if (i > 0) {
      const prev = password[i - 1];
      const prevCode = password.charCodeAt(i - 1);

      // Repeated characters (3+ consecutive)
      if (ch === prev) {
        repeatCount++;
        if (repeatCount >= 3) repeatedChars = true;
      } else {
        repeatCount = 1;
      }

      // Sequential characters (abc, 123, etc.)
      if (code === prevCode + 1 || code === prevCode - 1) {
        if (i >= 2) {
          const prev2Code = password.charCodeAt(i - 2);
          if (
            (prev2Code + 1 === prevCode && prevCode + 1 === code) ||
            (prev2Code - 1 === prevCode && prevCode - 1 === code)
          ) {
            sequentialChars = true;
          }
        }
      }
    }
  }

  const lowerPassword = password.toLowerCase();
  const lowerUsername = (username || "").toLowerCase().trim();

  // ── Check results ──────────────────────────────────────────────
  const lengthOk = password.length >= MIN_LENGTH;
  const notBanned = !BANNED_PASSWORDS.has(lowerPassword);
  const noUsername = !lowerUsername || !lowerPassword.includes(lowerUsername);
  const noCommonSeq = !COMMON_SEQUENCES.some(
    seq => seq.includes(lowerPassword) && lowerPassword.length >= 3
  );

  result.details.length = lengthOk;
  result.details.hasUpper = hasUpper;
  result.details.hasLower = hasLower;
  result.details.hasDigit = hasDigit;
  result.details.hasSymbol = hasSymbol;
  result.details.noRepeated = !repeatedChars;
  result.details.noSequential = !sequentialChars;
  result.details.noUsername = noUsername;
  result.details.notBanned = notBanned;
  result.details.noCommonSeq = noCommonSeq;

  // ── Feedback messages ──────────────────────────────────────────
  if (!lengthOk)
    result.feedback.push(`Use at least ${MIN_LENGTH} characters (currently ${password.length}).`);
  if (!hasUpper)
    result.feedback.push("Add at least one uppercase letter (A–Z).");
  if (!hasLower)
    result.feedback.push("Add at least one lowercase letter (a–z).");
  if (!hasDigit)
    result.feedback.push("Add at least one digit (0–9).");
  if (!hasSymbol)
    result.feedback.push("Add at least one special character (!@#$%^&*...).");
  if (!noUsername)
    result.feedback.push("Password should not contain the username.");
  if (!notBanned)
    result.feedback.push("This password is too common. Choose something unique.");
  if (!noCommonSeq)
    result.feedback.push("Password contains a common keyboard sequence.");
  if (repeatedChars)
    result.feedback.push("Avoid repeated characters like 'aaa' or '111'.");
  if (sequentialChars)
    result.feedback.push("Avoid sequential characters like 'abcd' or '1234'.");

  // ── Scoring ────────────────────────────────────────────────────
  let score = 0;
  if (lengthOk)      score += 25;
  if (hasUpper)      score += 15;
  if (hasLower)      score += 15;
  if (hasDigit)      score += 15;
  if (hasSymbol)     score += 15;
  if (!repeatedChars) score += 5;
  if (!sequentialChars) score += 5;
  if (noUsername)    score += 5;
  if (notBanned)     score += 5;

  // Bonus for extra length
  if (password.length >= 16) score = Math.min(score + 5, 100);
  if (password.length >= 20) score = Math.min(score + 5, 100);

  // Bonus if noCommonSeq (not counted in original, added as enhancement)
  if (noCommonSeq)   score = Math.min(score + 5, 100);

  result.score = Math.min(score, 100);
  result.level = strengthLevel(result.score);
  result.valid = result.feedback.length === 0;

  // ── Entropy estimate ───────────────────────────────────────────
  let pool = 0;
  if (hasLower) pool += 26;
  if (hasUpper) pool += 26;
  if (hasDigit) pool += 10;
  if (hasSymbol) pool += 32;
  if (pool > 0) {
    result.details.entropy = Math.round(password.length * Math.log2(pool));
  }

  return result;
}

function strengthLevel(score) {
  if (score >= 90) return "Very Strong";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Medium";
  if (score >= 40) return "Weak";
  return "Very Weak";
}

module.exports = { validate, MIN_LENGTH, BANNED_PASSWORDS };
