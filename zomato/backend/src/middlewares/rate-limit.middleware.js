const rateLimit = require('express-rate-limit');

const windowMs = 15 * 60 * 1000;
const make = (limit, extra = {}) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { message: 'Too many attempts. Please try again in a few minutes.' },
        ...extra,
    });

const num = (v, fallback) => (Number(v) > 0 ? Number(v) : fallback);

// per IP, per 15 minutes. Override with env vars if needed.
module.exports = {
    // only failed logins count, so normal users are never blocked
    loginLimiter: make(num(process.env.RATE_LIMIT_LOGIN_MAX, 10), { skipSuccessfulRequests: true }),
    registerLimiter: make(num(process.env.RATE_LIMIT_REGISTER_MAX, 20)),
    forgotLimiter: make(num(process.env.RATE_LIMIT_FORGOT_MAX, 6)),
    resetLimiter: make(num(process.env.RATE_LIMIT_RESET_MAX, 10)),
};
