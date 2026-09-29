const mongoose = require('mongoose');
const { foodPartnerModel } = require('../models/foodpartner.model');
const { foodModel } = require('../models/food.model');

async function getFoodPartnerById(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ message: 'Food partner not found' });
    }
    const foodPartner = await foodPartnerModel.findById(id).select('-password');
    if (!foodPartner) {
        return res.status(404).json({ message: 'Food partner not found' });
    }
    const foodItems = await foodModel.find({ foodPartner: id }).sort({ createdAt: -1 });
    const totalLikes = foodItems.reduce((sum, f) => sum + (f.likeCount || 0), 0);

    res.status(200).json({
        message: 'Food partner retrieved successfully',
        foodPartner: { ...foodPartner.toObject(), foodItems, totalLikes }
    });
}

module.exports = { getFoodPartnerById };
