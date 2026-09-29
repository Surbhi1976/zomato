const { foodPartnerModel } = require('../models/foodpartner.model');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Reads the JWT cookie and loads the matching account.
// Returns { kind: 'user' | 'partner', doc } or null.
async function resolveAccount(req) {
    const token = req.cookies.token;
    if (!token) return null;

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null; // bad signature or expired
    }

    let found = null;
    const user = await userModel.findById(decoded.id);
    if (user) found = { kind: 'user', doc: user };
    else {
        const partner = await foodPartnerModel.findById(decoded.id);
        if (partner) found = { kind: 'partner', doc: partner };
    }
    if (!found) return null;

    // a password change/reset logs out every session that was issued before it
    const changedAt = found.doc.passwordChangedAt;
    if (changedAt && decoded.iat < Math.floor(changedAt.getTime() / 1000)) return null;

    return found;
}

const requireKind = (kind) => async (req, res, next) => {
    if (!req.cookies.token) return res.status(401).json({ message: 'Please login first' });
    try {
        const account = await resolveAccount(req);
        if (!account) return res.status(401).json({ message: 'Unauthorized' });
        if (account.kind !== kind) return res.status(403).json({ message: 'You do not have permission to do this' });
        if (kind === 'user') req.user = account.doc;
        else req.foodPartner = account.doc;
        next();
    } catch (err) {
        next(err);
    }
};

const authUserMiddleware = requireKind('user');
const authFoodPartnerMiddleware = requireKind('partner');

// Accepts either a logged-in user or a logged-in food partner.
async function authAnyMiddleware(req, res, next) {
    if (!req.cookies.token) return res.status(401).json({ message: 'Please login first' });
    try {
        const account = await resolveAccount(req);
        if (!account) return res.status(401).json({ message: 'Unauthorized' });
        if (account.kind === 'user') req.user = account.doc;
        else req.foodPartner = account.doc;
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = { authFoodPartnerMiddleware, authUserMiddleware, authAnyMiddleware };
