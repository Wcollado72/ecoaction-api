const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');

const register = async (req, res, next) => {
    try {
        let { email, password } = req.body;

        email = typeof email === 'string' ? email.trim().toLowerCase() : email;
        password = typeof password === 'string' ? password.trim() : password;

        const validationErrors = [];

        if (!email) {
            validationErrors.push({
                field: 'email',
                message: 'Email is required.'
            });
        }

        if (!password) {
            validationErrors.push({
                field: 'password',
                message: 'Password is required.'
            });
        }

        if (password && password.length < 6) {
            validationErrors.push({
                field: 'password',
                message: 'Password must be at least 6 characters long.'
            });
        }

        if (password && password.length > 100) {
            validationErrors.push({
                field: 'password',
                message: 'Password must not exceed 100 characters.'
            });
        }

        if (validationErrors.length > 0) {
            return next(new AppError('Validation error.', 400, validationErrors));
        }

        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return next(new AppError('This email is already registered.', 409, [
                {
                    field: 'email',
                    message: 'This email is already registered.'
                }
            ]));
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email,
            password: hashedPassword
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: {
                id: newUser.id,
                email: newUser.email
            }
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        let { email, password } = req.body;

        email = typeof email === 'string' ? email.trim().toLowerCase() : email;
        password = typeof password === 'string' ? password.trim() : password;

        const validationErrors = [];

        if (!email) {
            validationErrors.push({
                field: 'email',
                message: 'Email is required.'
            });
        }

        if (!password) {
            validationErrors.push({
                field: 'password',
                message: 'Password is required.'
            });
        }

        if (validationErrors.length > 0) {
            return next(new AppError('Validation error.', 400, validationErrors));
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return next(new AppError('Invalid credentials.', 401));
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return next(new AppError('Invalid credentials.', 401));
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login
};