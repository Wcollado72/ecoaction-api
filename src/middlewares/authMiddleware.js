// File: src/middlewares/authMiddleware.js
// Description: JWT authentication middleware.
// Validates the Bearer token on every protected route and checks the logout blacklist.

const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const { isBlacklisted } = require('../utils/tokenBlacklist');

/**
 * Express middleware that:
 * 1. Extracts the Bearer token from the Authorization header.
 * 2. Rejects tokens that were invalidated via logout (blacklist check).
 * 3. Verifies the token signature and expiration with JWT.
 * 4. Attaches the decoded payload to req.user and the raw token to req.token.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Reject requests with no Authorization header
    if (!authHeader) {
        return next(new AppError('Access denied. No authorization header provided.', 401));
    }

    // Expect exactly: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return next(new AppError('Invalid authorization format. Use: Bearer <token>', 401));
    }

    const token = parts[1];

    // Reject tokens that were explicitly invalidated (logged out)
    if (isBlacklisted(token)) {
        return next(new AppError('Session expired. Please log in again.', 401));
    }

    try {
        // Verify signature and expiration
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;   // { id, email, iat, exp }
        req.token = token;    // Raw token needed for logout blacklisting
        next();
    } catch (error) {
        return next(new AppError('Invalid or expired token.', 401));
    }
};

module.exports = authenticateToken;
