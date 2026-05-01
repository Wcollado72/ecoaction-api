// File: src/utils/tokenBlacklist.js
// Description: In-memory token blacklist for server-side logout support.
// When a user logs out, their JWT is added here and rejected on subsequent requests.
//
// NOTE: This is an in-memory store — it resets on server restart.
// For production, replace with Redis or a database-backed blacklist table.

const blacklist = new Set();

/**
 * Adds a JWT token to the blacklist, effectively invalidating it.
 * @param {string} token - The raw JWT string to invalidate.
 */
const addToBlacklist = (token) => {
    blacklist.add(token);
};

/**
 * Checks whether a token has been invalidated (i.e., the user logged out).
 * @param {string} token - The raw JWT string to check.
 * @returns {boolean} True if the token is blacklisted.
 */
const isBlacklisted = (token) => {
    return blacklist.has(token);
};

module.exports = { addToBlacklist, isBlacklisted };
