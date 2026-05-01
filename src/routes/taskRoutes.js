// File: src/routes/taskRoutes.js
// Description: Task CRUD routes. All routes require a valid JWT (authenticateToken).
// The /seed route must be declared BEFORE /:id to avoid "seed" being treated as an ID.

const express = require('express');
const router = express.Router();

const taskController    = require('../controllers/taskController');
const authenticateToken = require('../middlewares/authMiddleware');

// All task routes are protected
router.use(authenticateToken);

// Seed route MUST come before /:id or Express will match "seed" as an ID param
router.post('/seed', taskController.seedTasks);

// Standard CRUD
router.post('/',    taskController.createTask);
router.get('/',     taskController.getTasks);
router.get('/:id',  taskController.getTaskById);
router.put('/:id',  taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
