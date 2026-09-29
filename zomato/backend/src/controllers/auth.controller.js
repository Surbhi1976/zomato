const crypto = require('crypto');
const userModel = require('../models/user.model');
const { foodPartnerModel } = require('../models/foodpartner.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../services/mail.service');
const { normalizeEmail, isEmail, passwordError } = require('../utils/validators');
const { verifyGoogleCredential } = require('../services/google.service');

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: true,
    // cross-site deployments (frontend and backend on different domains) need SameSite=None + Secure
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

function signAndSetCookie(res, id) {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, cookieOptions);
}

function clearAuthCookie(res) {
    res.clearCookie('token', { ...cookieOptions, maxAge: undefined });
}

function missing(res, fields) {
    return res.status(400).json({ message: `${fields.join(', ')} ${fields.length > 1 ? 'are' : 'is'} required` });
}

const isBlank = (v) => typeof v !== 'string' || !v.trim();

// ---------- USER ----------
async function registerUser(req, res) {
    const absent = ['fullName', 'email', 'password'].filter((k) => isBlank(req.body[k]));
    if (absent.length) return missing(res, absent);

    const email = normalizeEmail(req.body.email);
    if (!isEmail(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
    const pwError = passwordError(req.body.password);
    if (pwError) return res.status(400).json({ message: pwError });

    const isUserAlreadyExists = await userModel.findOne({ email });
    if (isUserAlreadyExists) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await userModel.create({ fullName: req.body.fullName.trim(), email, password: hashedPassword });

    signAndSetCookie(res, user._id);
    res.status(201).json({
        message: 'user registered successfully',
        user: { _id: user._id, email: user.email, fullName: user.fullName }
    });
}

async function loginUser(req, res) {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!email || typeof password !== 'string' || !password) return missing(res, ['email', 'password']);

    const user = await userModel.findOne({ email });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    signAndSetCookie(res, user._id);
    res.status(200).json({
        message: 'User logged in successfully',
        user: { _id: user._id, email: user.email, fullName: user.fullName }
    });
}

// POST /api/auth/user/google  { credential }   (customers only)
// `credential` is the ID token Google's popup gives the browser. It is verified here on the server,
// so the browser can never simply claim "I am someone@gmail.com".
async function googleLogin(req, res) {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(503).json({ message: 'Google sign-in is not configured on the server.' });
    }
    const { credential } = req.body;
    if (typeof credential !== 'string' || !credential || credential.length > 4096) {
        return res.status(400).json({ message: 'credential is required' });
    }

    let payload;
    try {
        payload = await verifyGoogleCredential(credential);
    } catch {
        return res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
    }
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        return res.status(401).json({ message: 'Your Google account email is not verified.' });
    }

    const email = normalizeEmail(payload.email);
    let user = await userModel.findOne({ googleId: payload.sub });

    if (!user) {
        user = await userModel.findOne({ email });
        if (user) {
            // Same email already registered: link the Google account to it (Google has verified the email is theirs).
            // If it had a password, remove it: at signup nobody proved they owned that email, so a password set by
            // someone else must not survive. The owner can always sign in with Google or use "Forgot password".
            const update = { $set: { googleId: payload.sub } };
            if (user.password) {
                update.$unset = { password: '' };
                update.$set.passwordChangedAt = new Date(); // also signs out any older session
            }
            await userModel.updateOne({ _id: user._id }, update);
            user = await userModel.findById(user._id);
        } else {
            try {
                user = await userModel.create({
                    fullName: String(payload.name || email.split('@')[0]).trim().slice(0, 80),
                    email,
                    googleId: payload.sub,
                });
            } catch (err) {
                if (err.code !== 11000) throw err;
                user = await userModel.findOne({ email }); // two first-time requests raced; use the winner
            }
        }
    }

    signAndSetCookie(res, user._id);
    res.status(200).json({
        message: 'User logged in with Google successfully',
        user: { _id: user._id, email: user.email, fullName: user.fullName }
    });
}

function logoutUser(req, res) {
    clearAuthCookie(res);
    res.status(200).json({ message: 'User logged out successfully' });
}

// ---------- FOOD PARTNER ----------
async function registerFoodPartner(req, res) {
    const absent = ['name', 'email', 'password', 'phone', 'address', 'contactname'].filter((k) => isBlank(req.body[k]));
    if (absent.length) return missing(res, absent);

    const email = normalizeEmail(req.body.email);
    if (!isEmail(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
    const pwError = passwordError(req.body.password);
    if (pwError) return res.status(400).json({ message: pwError });

    const exists = await foodPartnerModel.findOne({ email });
    if (exists) {
        return res.status(400).json({ message: 'Food partner already exists' });
    }
    const { name, phone, address, contactname } = req.body;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const foodPartner = await foodPartnerModel.create({
        name: name.trim(), email, password: hashedPassword,
        phone: phone.trim(), address: address.trim(), contactname: contactname.trim()
    });

    signAndSetCookie(res, foodPartner._id);
    res.status(201).json({
        message: 'Food partner registered successfully',
        foodPartner: { _id: foodPartner._id, email: foodPartner.email, name: foodPartner.name }
    });
}

async function loginFoodPartner(req, res) {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!email || typeof password !== 'string' || !password) return missing(res, ['email', 'password']);

    const foodPartner = await foodPartnerModel.findOne({ email });
    if (!foodPartner || !(await bcrypt.compare(password, foodPartner.password))) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    signAndSetCookie(res, foodPartner._id);
    res.status(200).json({
        message: 'Food partner logged in successfully',
        foodPartner: { _id: foodPartner._id, email: foodPartner.email, name: foodPartner.name }
    });
}

const logoutFoodPartner = (req, res) => {
    clearAuthCookie(res);
    res.status(200).json({ message: 'Food partner logged out successfully' });
};

// ---------- SESSION ----------
// Tells the frontend who is logged in (user or partner).
function me(req, res) {
    if (req.user) {
        return res.json({
            role: 'user',
            user: { _id: req.user._id, email: req.user.email, fullName: req.user.fullName }
        });
    }
    res.json({
        role: 'partner',
        foodPartner: { _id: req.foodPartner._id, email: req.foodPartner.email, name: req.foodPartner.name }
    });
}

// ---------- FORGOT / RESET PASSWORD ----------
const RESET_TTL_MS = 30 * 60 * 1000; // links are valid for 30 minutes
const APP_NAME = () => process.env.APP_NAME || 'Bitereel';
const MODELS = { user: userModel, partner: foodPartnerModel };
const roleOf = (body) => (body.role === 'partner' ? 'partner' : 'user');
// only a hash is stored, so a leaked database cannot be used to reset passwords
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

// POST /api/auth/forgot-password  { email, role: "user" | "partner" }
// Always answers the same way, so the endpoint cannot be used to find out which emails have accounts.
async function forgotPassword(req, res) {
    const role = roleOf(req.body);
    const email = normalizeEmail(req.body.email);
    if (!email) return missing(res, ['email']);
    if (!isEmail(email)) return res.status(400).json({ message: 'Please enter a valid email address' });

    const generic = { message: 'If an account exists for that email, we have sent a password reset link.' };

    const account = await MODELS[role].findOne({ email });
    if (!account) return res.status(200).json(generic);

    const token = crypto.randomBytes(32).toString('hex');
    await MODELS[role].updateOne(
        { _id: account._id },
        { $set: { passwordResetToken: sha256(token), passwordResetExpires: new Date(Date.now() + RESET_TTL_MS) } }
    );

    const link = `${clientUrl()}/reset-password?role=${role}&token=${token}`;
    const name = APP_NAME();
    try {
        await sendMail({
            to: account.email,
            subject: `Reset your ${name} password`,
            text:
                `Hi,\n\nWe received a request to reset your ${name} password.\n` +
                `Open this link to choose a new one (valid for 30 minutes):\n\n${link}\n\n` +
                `If you did not ask for this, you can safely ignore this email. Your password will not change.`,
            html:
                `<p>Hi,</p><p>We received a request to reset your <b>${name}</b> password.</p>` +
                `<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#ff6a2b;color:#fff;` +
                `border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a></p>` +
                `<p>This link is valid for 30 minutes. If the button does not work, paste this into your browser:<br>${link}</p>` +
                `<p>If you did not ask for this, you can safely ignore this email. Your password will not change.</p>`,
        });
    } catch (err) {
        // still answer generically (do not reveal that the account exists) but make the problem visible in the logs
        console.error('Could not send password reset email:', err.message);
    }
    res.status(200).json(generic);
}

// POST /api/auth/reset-password  { token, password, role }
async function resetPassword(req, res) {
    const role = roleOf(req.body);
    const { token, password } = req.body;
    const invalid = () => res.status(400).json({ message: 'This reset link is invalid or has expired. Please request a new one.' });

    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return invalid();
    const pwError = passwordError(password);
    if (pwError) return res.status(400).json({ message: pwError });

    const hashedPassword = await bcrypt.hash(password, 10);
    // Atomic: the filter matches only a valid, unexpired token, and the same update that sets the new
    // password also deletes the token. Two requests can never both succeed, so a link works exactly once.
    const result = await MODELS[role].updateOne(
        { passwordResetToken: sha256(token), passwordResetExpires: { $gt: new Date() } },
        {
            $set: { password: hashedPassword, passwordChangedAt: new Date() },
            $unset: { passwordResetToken: '', passwordResetExpires: '' },
        }
    );
    if (result.modifiedCount !== 1) return invalid();

    clearAuthCookie(res);
    res.status(200).json({ message: 'Your password has been updated. Please sign in.' });
}

module.exports = {
    registerUser, loginUser, googleLogin, logoutUser,
    registerFoodPartner, loginFoodPartner, logoutFoodPartner,
    me, forgotPassword, resetPassword
};
