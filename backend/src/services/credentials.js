// backend/src/services/credentials.js
//
// Helpers for generating usernames, random passwords, and OTP codes.

const crypto = require('crypto');

// Easy to read alphabet (no 0/O/1/l/I)
const PWD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const SPECIAL      = '!@#$%^&*';

/** Cryptographically random index in [0, n). */
function randInt(n) {
  // 4 bytes → uint32 → modulo (modulo bias is negligible for these small n)
  return crypto.randomBytes(4).readUInt32BE(0) % n;
}

function pick(str) { return str[randInt(str.length)]; }

/**
 * 12-character random password, guaranteed to contain ≥1 uppercase,
 * ≥1 lowercase, ≥1 digit and ≥1 special.
 */
function generatePassword(length = 12) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digit = '23456789';
  const required = [pick(upper), pick(lower), pick(digit), pick(SPECIAL)];
  const rest = [];
  for (let i = required.length; i < length; i++) rest.push(pick(PWD_ALPHABET + SPECIAL));
  // shuffle
  const all = [...required, ...rest];
  for (let i = all.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.join('');
}

/** 6-digit numeric OTP as a string (e.g. "049813"). */
function generateOtp() {
  const n = crypto.randomBytes(4).readUInt32BE(0) % 1_000_000;
  return n.toString().padStart(6, '0');
}

/**
 * Build a unique, URL-safe username from a full name + email.
 *  - lowercase, ASCII letters/digits/dot/underscore only
 *  - falls back to email-local-part if the name is empty
 *  - caller passes `existsFn(candidate)` returning true when taken;
 *    we append numeric suffixes until a free one is found.
 */
async function generateUsername(fullName, email, existsFn) {
  const cleanFromName = (fullName || '')
    .normalize('NFKD').replace(/[^\x20-\x7E]/g, '')   // strip accents/non-ASCII
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 30);

  const base = cleanFromName || (email.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9._]/g, '');
  let candidate = base || 'alumni';
  if (!(await existsFn(candidate))) return candidate;

  for (let i = 1; i < 9999; i++) {
    candidate = `${base}${i}`;
    if (!(await existsFn(candidate))) return candidate;
  }
  // Last-resort fallback
  return `${base}.${Date.now().toString().slice(-6)}`;
}

module.exports = { generatePassword, generateOtp, generateUsername };
