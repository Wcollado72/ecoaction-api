// File: src/routes/authRoutes.js
// Description: Authentication routes.
// Public routes:    register, login, forgot-password, reset-password.
// Protected routes: logout, me (require valid JWT).

const express = require('express');
const router  = express.Router();

const authController    = require('../controllers/authController');
const authenticateToken = require('../middlewares/authMiddleware');

// Public
router.post('/register',        authController.register);
router.post('/login',           authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',  authController.resetPassword);

// Protected (valid JWT required)
router.post('/logout', authenticateToken, authController.logout);
router.get('/me',      authenticateToken, authController.getMe);

module.exports = router;
