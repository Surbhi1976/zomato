const express = require('express');
const foodController = require('../controllers/food.controller');
const commentController = require('../controllers/comment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

// partner uploads a food reel
router.post('/', authMiddleware.authFoodPartnerMiddleware, upload.single('video'), foodController.createFood);

// user feed
router.get('/', authMiddleware.authUserMiddleware, foodController.getFoodItems);

// like / save toggles
router.post('/like', authMiddleware.authUserMiddleware, foodController.likeFood);
router.post('/save', authMiddleware.authUserMiddleware, foodController.saveFood);
router.get('/save', authMiddleware.authUserMiddleware, foodController.getSavedFoods);

// comments (declared after the fixed paths above so they never shadow them)
router.delete('/comments/:commentId', authMiddleware.authUserMiddleware, commentController.deleteComment);
router.get('/:id/comments', authMiddleware.authUserMiddleware, commentController.getComments);
router.post('/:id/comments', authMiddleware.authUserMiddleware, commentController.addComment);

// partner deletes their own video
router.delete('/:id', authMiddleware.authFoodPartnerMiddleware, foodController.deleteFood);

module.exports = router;
