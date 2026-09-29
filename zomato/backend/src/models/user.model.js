const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
    },
    // Google account id ("sub" claim). Only set for people who signed in with Google.
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    // password reset (only a SHA-256 hash of the emailed token is stored)
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    // logins issued before this moment stop working (set when the password changes)
    passwordChangedAt: { type: Date },
},
    {
        timestamps: true
    }
)

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
