// File: src/app.js
// Description: Express application entry point.
// Loads environment variables, configures middleware, mounts routes,
// and registers the global error handler AFTER all routes.

// Load .env variables FIRST — before any other require that might need them
require('dotenv').config();

const express    = require('express');
const path       = require('path');
const cors       = require('cors');
const sequelize  = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Models — must be imported so Sequelize registers them before sync()
const User = require('./models/User'); // eslint-disable-line no-unused-vars
const Task = require('./models/Task'); // eslint-disable-line no-unused-vars

// Global error handler (registered AFTER routes — this is critical)
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────

// Allow cross-origin requests (useful when frontend is served separately in dev)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Serve the static frontend files from /public
app.use(express.static(path.join(__dirname, '../public')));

// ─── ROUTES ────────────────────────────────────────────────────────────────────

// API routes
app.use('/api/auth',  authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check — useful for uptime monitors and deployment pipelines
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status:    'ok',
        timestamp: new Date().toISOString()
    });
});

// Fallback: serve index.html for any unknown route (SPA support)
// Express 5 requires a named wildcard parameter instead of bare '*'
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
// MUST be registered after all routes — Express identifies error handlers
// by their 4-argument signature (err, req, res, next).
app.use(errorHandler);

// ─── SERVER STARTUP ────────────────────────────────────────────────────────────

const startServer = async () => {
    try {
        // Sync models with the database (alter: true updates tables without data loss)
        await sequelize.sync({ alter: true });
        console.log('✅ Database synchronized successfully.');

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🌿 EcoAction API running at http://localhost:${PORT}`);
            console.log(`   Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Error starting the server:', error);
        process.exit(1);
    }
};

startServer();
