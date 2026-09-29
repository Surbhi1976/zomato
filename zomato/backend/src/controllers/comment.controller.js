const mongoose = require('mongoose');
const commentModel = require('../models/comment.model');
const { foodModel } = require('../models/food.model');

const shape = (c, userId) => ({
    _id: c._id,
    text: c.text,
    createdAt: c.createdAt,
    user: { _id: c.user?._id, fullName: c.user?.fullName || 'Deleted user' },
    isMine: String(c.user?._id ?? c.user) === String(userId),
});

// GET /api/food/:id/comments
async function getComments(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Food not found' });
    const comments = await commentModel.find({ food: id })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('user', 'fullName');
    res.status(200).json({ comments: comments.map((c) => shape(c, req.user._id)) });
}

// POST /api/food/:id/comments  { text }
async function addComment(req, res) {
    const { id } = req.params;
    const text = String(req.body.text || '').trim();
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Food not found' });
    if (!text) return res.status(400).json({ message: 'Comment cannot be empty' });
    if (text.length > 300) return res.status(400).json({ message: 'Comment is too long (max 300 characters)' });

    const food = await foodModel.findById(id);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    const comment = await commentModel.create({ user: req.user._id, food: id, text });
    const updated = await foodModel.findByIdAndUpdate(id, { $inc: { commentCount: 1 } }, { returnDocument: 'after' });
    await comment.populate('user', 'fullName');

    res.status(201).json({ comment: shape(comment, req.user._id), commentCount: updated.commentCount });
}

// DELETE /api/food/comments/:commentId  (author only)
async function deleteComment(req, res) {
    const { commentId } = req.params;
    if (!mongoose.isValidObjectId(commentId)) return res.status(404).json({ message: 'Comment not found' });

    const comment = await commentModel.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (String(comment.user) !== String(req.user._id)) {
        return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await commentModel.deleteOne({ _id: commentId });
    const updated = await foodModel.findByIdAndUpdate(comment.food, { $inc: { commentCount: -1 } }, { returnDocument: 'after' });
    res.status(200).json({ message: 'Comment deleted', commentCount: Math.max(0, updated?.commentCount ?? 0) });
}

module.exports = { getComments, addComment, deleteComment };
