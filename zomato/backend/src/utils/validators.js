// Emails are stored lowercase so "Ann@x.com" and "ann@x.com" are the same account.
// String() also neutralises NoSQL-injection payloads such as { "$gt": "" } sent as an email.
const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();

const isEmail = (email) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// bcrypt only uses the first 72 bytes, so longer passwords are rejected instead of silently truncated.
function passwordError(password) {
    if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters';
    if (Buffer.byteLength(password) > 72) return 'Password must be at most 72 characters';
    return null;
}

module.exports = { normalizeEmail, isEmail, passwordError };
