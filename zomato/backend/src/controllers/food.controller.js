const { foodModel } = require('../models/food.model');
const likeModel = require('../models/likes.model');
const saveModel = require('../models/save.model');
const commentModel = require('../models/comment.model');
const { foodPartnerModel } = require('../models/foodpartner.model');
const mongoose = require('mongoose');
const storageService = require('../services/storage.services');
const { randomUUID } = require('crypto');

async function createFood(req, res) {
    const { name, description } = req.body;
    if (!name || !description) {
        return res.status(400).json({ message: 'name and description are required' });
    }
    if (!req.file) {
        return res.status(400).json({ message: 'A video file is required' });
    }
    if (!req.file.mimetype.startsWith('video/')) {
        return res.status(400).json({ message: 'Only video files are allowed' });
    }

    const fileUploadResult = await storageService.uploadFile(req.file.buffer, randomUUID());

    const foodItem = await foodModel.create({
        name,
        description,
        video: fileUploadResult.url,
        videoFileId: fileUploadResult.fileId,
        foodPartner: req.foodPartner._id
    });
    res.status(201).json({ message: 'food created successfully', food: foodItem });
}

// Adds isLiked / isSaved flags for the current user to a list of food docs.
async function decorateForUser(userId, foods) {
    const ids = foods.map((f) => f._id);
    const [likes, saves] = await Promise.all([
        likeModel.find({ user: userId, food: { $in: ids } }).select('food'),
        saveModel.find({ user: userId, food: { $in: ids } }).select('food'),
    ]);
    const liked = new Set(likes.map((l) => String(l.food)));
    const saved = new Set(saves.map((s) => String(s.food)));
    return foods.map((f) => ({
        ...f.toObject(),
        isLiked: liked.has(String(f._id)),
        isSaved: saved.has(String(f._id)),
    }));
}

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/food?q=pizza  (q searches dish name, description and restaurant name)
async function getFoodItems(req, res) {
    const q = String(req.query.q || '').trim().slice(0, 60);
    const filter = {};
    if (q) {
        const rx = new RegExp(escapeRegex(q), 'i');
        const partners = await foodPartnerModel.find({ name: rx }).select('_id');
        filter.$or = [
            { name: rx },
            { description: rx },
            { foodPartner: { $in: partners.map((p) => p._id) } },
        ];
    }
    const foods = await foodModel.find(filter)
        .sort({ createdAt: -1 })
        .populate('foodPartner', 'name');
    const foodItems = await decorateForUser(req.user._id, foods);
    res.status(200).json({ message: 'food items fetched successfully', foodItems });
}

async function likeFood(req, res) {
    const { foodId } = req.body;
    if (!foodId) return res.status(400).json({ message: 'foodId is required' });

    const food = await foodModel.findById(foodId);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    const existing = await likeModel.findOne({ user: req.user._id, food: foodId });
    if (existing) {
        await likeModel.deleteOne({ _id: existing._id });
        const updated = await foodModel.findByIdAndUpdate(foodId, { $inc: { likeCount: -1 } }, { returnDocument: 'after' });
        return res.status(200).json({ message: 'Food unliked successfully', like: false, likeCount: Math.max(0, updated.likeCount) });
    }

    await likeModel.create({ user: req.user._id, food: foodId });
    const updated = await foodModel.findByIdAndUpdate(foodId, { $inc: { likeCount: 1 } }, { returnDocument: 'after' });
    res.status(201).json({ message: 'Food liked successfully', like: true, likeCount: updated.likeCount });
}

async function saveFood(req, res) {
    const { foodId } = req.body;
    if (!foodId) return res.status(400).json({ message: 'foodId is required' });

    const food = await foodModel.findById(foodId);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    const existing = await saveModel.findOne({ user: req.user._id, food: foodId });
    if (existing) {
        await saveModel.deleteOne({ _id: existing._id });
        const updated = await foodModel.findByIdAndUpdate(foodId, { $inc: { saveCount: -1 } }, { returnDocument: 'after' });
        return res.status(200).json({ message: 'Food unsaved successfully', save: false, saveCount: Math.max(0, updated.saveCount) });
    }

    await saveModel.create({ user: req.user._id, food: foodId });
    const updated = await foodModel.findByIdAndUpdate(foodId, { $inc: { saveCount: 1 } }, { returnDocument: 'after' });
    res.status(201).json({ message: 'Food saved successfully', save: true, saveCount: updated.saveCount });
}

async function getSavedFoods(req, res) {
    const saves = await saveModel.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .populate({ path: 'food', populate: { path: 'foodPartner', select: 'name' } });
    const foods = saves.map((s) => s.food).filter(Boolean);
    const foodItems = await decorateForUser(req.user._id, foods);
    res.status(200).json({ message: 'Saved foods fetched successfully', foodItems });
}

// DELETE /api/food/:id  (only the partner who owns it)
async function deleteFood(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Food not found' });

    const food = await foodModel.findById(id);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    if (String(food.foodPartner) !== String(req.foodPartner._id)) {
        return res.status(403).json({ message: 'You can only delete your own videos' });
    }

    await Promise.all([
        likeModel.deleteMany({ food: id }),
        saveModel.deleteMany({ food: id }),
        commentModel.deleteMany({ food: id }),
        foodModel.deleteOne({ _id: id }),
    ]);
    // best effort: a failed ImageKit cleanup shouldn't fail the request
    storageService.deleteFile(food.videoFileId).catch((err) => console.error('ImageKit delete failed:', err.message));

    res.status(200).json({ message: 'Food deleted successfully' });
}

module.exports = { createFood, getFoodItems, likeFood, saveFood, getSavedFoods, deleteFood };
