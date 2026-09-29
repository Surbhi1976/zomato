const express = require('express');
const foodPartnerController = require('../controllers/food-partner.controller');
const { authAnyMiddleware } = require('../middlewares/auth.middleware');
const router = express.Router();

router.get('/:id', authAnyMiddleware, foodPartnerController.getFoodPartnerById);

module.exports = router;
