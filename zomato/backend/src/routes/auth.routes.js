const express = require('express');
const authController = require('../controllers/auth.controller.js');
const { authAnyMiddleware } = require('../middlewares/auth.middleware');
const { loginLimiter, registerLimiter, forgotLimiter, resetLimiter } = require('../middlewares/rate-limit.middleware');
const router = express.Router();

// current session
router.get('/me', authAnyMiddleware, authController.me);

// user auth apis
router.post('/user/register', registerLimiter, authController.registerUser);
router.post('/user/login', loginLimiter, authController.loginUser);
router.post('/user/google', loginLimiter, authController.googleLogin);
router.get('/user/logout', authController.logoutUser);

// food partner auth apis
router.post('/foodpartner/register', registerLimiter, authController.registerFoodPartner);
router.post('/foodpartner/login', loginLimiter, authController.loginFoodPartner);
router.get('/foodpartner/logout', authController.logoutFoodPartner);

// password reset (works for both account types; body.role picks which)
router.post('/forgot-password', forgotLimiter, authController.forgotPassword);
router.post('/reset-password', resetLimiter, authController.resetPassword);
module.exports = router;
