const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'food', required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 300 },
}, { timestamps: true });

module.exports = mongoose.model('comment', commentSchema);
