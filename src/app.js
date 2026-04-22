// Import Express and required dependencies
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/db');

// Import application routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Import models so Sequelize can register them before syncing
const User = require('./models/User');
const Task = require('./models/Task');

// Import global error handler
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Global middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check route
app.get('/api/health', (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'API is running successfully.'
    });
});

// Route registration
// All authentication routes will start with /api/auth
app.use('/api/auth', authRoutes);

// All task routes will start with /api/tasks
app.use('/api/tasks', taskRoutes);

// Handle unknown routes
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: 'Route not found.'
    });
});

// Global error handling middleware
app.use(errorHandler);

// Server startup function
const startServer = async () => {
    try {
        // Sync all models with the database
        // { alter: true } updates the tables to match model changes during development
        await sequelize.sync({ alter: true });
        console.log('✅ Database tables synchronized successfully.');

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`🚀 EcoAction API is running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error starting the server:', error);
    }
};

// Start the application
startServer();