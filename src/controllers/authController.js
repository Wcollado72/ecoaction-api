// File: src/controllers/authController.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { Op } = require('sequelize');
const User     = require('../models/User');
const AppError = require('../utils/appError');
const { addToBlacklist } = require('../utils/tokenBlacklist');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── REGISTER ──────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
    try {
        let { email, password } = req.body;
        email    = typeof email    === 'string' ? email.trim().toLowerCase() : email;
        password = typeof password === 'string' ? password.trim()            : password;

        const errs = [];
        if (!email)                        errs.push({ field: 'email',    message: 'Email is required.'                              });
        else if (!EMAIL_REGEX.test(email)) errs.push({ field: 'email',    message: 'Email format is invalid.'                       });
        if (!password)                     errs.push({ field: 'password', message: 'Password is required.'                          });
        else if (password.length < 6)      errs.push({ field: 'password', message: 'Password must be at least 6 characters long.'   });
        else if (password.length > 100)    errs.push({ field: 'password', message: 'Password must not exceed 100 characters.'       });
        if (errs.length > 0) return next(new AppError('Validation error.', 400, errs));

        const existing = await User.findOne({ where: { email } });
        if (existing) return next(new AppError('This email is already registered.', 409, [
            { field: 'email', message: 'This email is already registered.' }
        ]));

        const hashed  = await bcrypt.hash(password, 10);
        const newUser = await User.create({ email, password: hashed });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: { id: newUser.id, email: newUser.email }
        });
    } catch (err) { next(err); }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
    try {
        let { email, password } = req.body;
        email    = typeof email    === 'string' ? email.trim().toLowerCase() : email;
        password = typeof password === 'string' ? password.trim()            : password;

        const errs = [];
        if (!email)    errs.push({ field: 'email',    message: 'Email is required.'    });
        if (!password) errs.push({ field: 'password', message: 'Password is required.' });
        if (errs.length > 0) return next(new AppError('Validation error.', 400, errs));

        const user = await User.findOne({ where: { email } });
        if (!user) return next(new AppError('Invalid credentials.', 401));

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return next(new AppError('Invalid credentials.', 401));

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        return res.status(200).json({
            success: true, message: 'Login successful.', token,
            user: { id: user.id, email: user.email }
        });
    } catch (err) { next(err); }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
    try {
        addToBlacklist(req.token);
        return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err) { next(err); }
};

// ── GET ME ────────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'email', 'createdAt']
        });
        if (!user) return next(new AppError('User not found.', 404));
        return res.status(200).json({ success: true, data: { id: user.id, email: user.email, createdAt: user.createdAt } });
    } catch (err) { next(err); }
};

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
// Generates a secure reset token (SHA-256 hash stored in DB).
// The raw token is returned in the response for dev/testing.
// In production it would be sent by email only, never in the API response.
// Route: POST /api/auth/forgot-password  (public)
const forgotPassword = async (req, res, next) => {
    try {
        let { email } = req.body;
        email = typeof email === 'string' ? email.trim().toLowerCase() : email;

        if (!email || !EMAIL_REGEX.test(email)) {
            return next(new AppError('A valid email address is required.', 400, [
                { field: 'email', message: 'Please enter a valid email address.' }
            ]));
        }

        const user = await User.findOne({ where: { email } });

        // Respond generically whether or not the email exists (prevent enumeration)
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If that email is registered, a reset token has been generated.'
            });
        }

        const rawToken    = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiry      = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await user.update({
            resetPasswordToken:  hashedToken,
            resetPasswordExpiry: expiry
        });

        return res.status(200).json({
            success:         true,
            message:         'Reset token generated. Copy it and use it in the reset form.',
            dev_reset_token: rawToken,
            dev_note:        'DEV MODE ONLY - In production this would be sent by email. Expires in 1 hour.'
        });
    } catch (err) { next(err); }
};

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
// Validates token hash + expiry, updates password, clears reset fields.
// Route: POST /api/auth/reset-password  (public)
// Body:  { token, newPassword }
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        const errs = [];
        if (!token)       errs.push({ field: 'token',       message: 'Reset token is required.'  });
        if (!newPassword) errs.push({ field: 'newPassword', message: 'New password is required.' });
        if (newPassword && newPassword.trim().length < 6)
            errs.push({ field: 'newPassword', message: 'New password must be at least 6 characters long.' });
        if (errs.length > 0) return next(new AppError('Validation error.', 400, errs));

        const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

        const user = await User.findOne({
            where: {
                resetPasswordToken:  hashedToken,
                resetPasswordExpiry: { [Op.gt]: new Date() }
            }
        });

        if (!user) return next(new AppError('The reset token is invalid or has expired. Please request a new one.', 400));

        const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
        await user.update({
            password:            hashedPassword,
            resetPasswordToken:  null,
            resetPasswordExpiry: null
        });

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.'
        });
    } catch (err) { next(err); }
};

module.exports = { register, login, logout, getMe, forgotPassword, resetPassword };
