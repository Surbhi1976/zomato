const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'food', required: true },
}, { timestamps: true });

// one like per user per food
likeSchema.index({ user: 1, food: 1 }, { unique: true });

module.exports = mongoose.model('like', likeSchema);
