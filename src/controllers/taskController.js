// File: src/controllers/taskController.js
// Description: Full CRUD for tasks plus a seed endpoint that creates
// pre-defined eco-action tasks for the authenticated user.

const { Op, fn, col, where } = require('sequelize');
const Task = require('../models/Task');
const AppError = require('../utils/appError');

const validStatuses = ['pending', 'in_progress', 'done'];

// ─── PRE-DEFINED ECO TASKS ─────────────────────────────────────────────────────
// These are the sample tasks created when a user hits POST /api/tasks/seed.
// Each one is a real-world environmental action with a clear description.
const SAMPLE_ECO_TASKS = [
    {
        title: 'Plant a tree in your neighborhood',
        description: 'Choose a native species and plant it in a local park or your garden. Native trees support local wildlife and need less water.',
        status: 'pending',
        due_date: null
    },
    {
        title: 'Eliminate single-use plastics this week',
        description: 'Bring reusable bags, a water bottle, and containers. Refuse plastic straws, cups, and packaging wherever possible.',
        status: 'in_progress',
        due_date: null
    },
    {
        title: 'Set up a home recycling station',
        description: 'Create clearly labeled bins for paper, plastic, glass, metal, and organic waste. Place them somewhere accessible in the kitchen.',
        status: 'pending',
        due_date: null
    },
    {
        title: 'Use public transport or bike for 3 days',
        description: 'Replace car trips with cycling, walking, or public transit for at least three days. Track the CO₂ you save.',
        status: 'pending',
        due_date: null
    },
    {
        title: 'Attend a local environmental cleanup event',
        description: 'Join a community cleanup at a beach, park, river, or trail. Bring gloves and bags. Check local social media for upcoming events.',
        status: 'pending',
        due_date: null
    },
    {
        title: 'Switch all lights at home to LED bulbs',
        description: 'LED bulbs use up to 80% less energy than incandescent ones and last 25x longer. Start with the rooms you use most.',
        status: 'pending',
        due_date: null
    },
    {
        title: 'Start a compost bin',
        description: 'Collect fruit peels, coffee grounds, eggshells, and vegetable scraps. Compost reduces landfill waste and creates natural fertilizer.',
        status: 'pending',
        due_date: null
    },
    {
        title: 'Buy locally grown produce for one month',
        description: 'Visit a farmers market or local co-op. Locally grown food has a shorter supply chain and a significantly lower carbon footprint.',
        status: 'in_progress',
        due_date: null
    },
    {
        title: 'Measure your household water usage',
        description: 'Check your water bill, identify areas of high consumption (showers, irrigation, laundry), and set a 20% reduction goal.',
        status: 'pending',
        due_date: null
    },
    {
        title: 'Complete your personal carbon footprint audit',
        description: 'Use an online carbon calculator to estimate your annual CO₂ output. Identify your top 3 emission sources and create an action plan.',
        status: 'done',
        due_date: null
    }
];

// ─── CREATE TASK ───────────────────────────────────────────────────────────────

const createTask = async (req, res, next) => {
    try {
        const { title, description, status, due_date } = req.body;
        const validationErrors = [];

        if (!title || !title.trim()) {
            validationErrors.push({ field: 'title', message: 'Title is required.' });
        }

        if (status && !validStatuses.includes(status)) {
            validationErrors.push({
                field: 'status',
                message: 'Invalid status. Allowed values: pending, in_progress, done.'
            });
        }

        if (validationErrors.length > 0) {
            return next(new AppError('Validation error.', 400, validationErrors));
        }

        const newTask = await Task.create({
            title:       title.trim(),
            description: description || null,
            status:      status || 'pending',
            due_date:    due_date || null,
            userId:      req.user.id
        });

        return res.status(201).json({
            success: true,
            message: 'Task created successfully.',
            data: newTask
        });

    } catch (error) {
        next(error);
    }
};

// ─── GET ALL TASKS (with optional filters) ─────────────────────────────────────

const getTasks = async (req, res, next) => {
    try {
        const { status, due_date } = req.query;

        const whereClause = { userId: req.user.id };

        // Optional: filter by status
        if (status) {
            if (!validStatuses.includes(status)) {
                return next(new AppError('Validation error.', 400, [
                    { field: 'status', message: 'Invalid status. Allowed: pending, in_progress, done.' }
                ]));
            }
            whereClause.status = status;
        }

        const queryOptions = {
            where: whereClause,
            order: [['createdAt', 'DESC']]
        };

        // Optional: filter by due date (matches the date portion only)
        if (due_date) {
            queryOptions.where = {
                ...whereClause,
                [Op.and]: [where(fn('DATE', col('due_date')), due_date)]
            };
        }

        const tasks = await Task.findAll(queryOptions);

        return res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });

    } catch (error) {
        next(error);
    }
};

// ─── GET TASK BY ID ────────────────────────────────────────────────────────────

const getTaskById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const task = await Task.findOne({
            where: { id, userId: req.user.id }
        });

        if (!task) {
            return next(new AppError('Task not found.', 404));
        }

        return res.status(200).json({ success: true, data: task });

    } catch (error) {
        next(error);
    }
};

// ─── UPDATE TASK ───────────────────────────────────────────────────────────────

const updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, status, due_date } = req.body;
        const validationErrors = [];

        if (title !== undefined && !title.trim()) {
            validationErrors.push({ field: 'title', message: 'Title cannot be empty.' });
        }

        if (status && !validStatuses.includes(status)) {
            validationErrors.push({
                field: 'status',
                message: 'Invalid status. Allowed values: pending, in_progress, done.'
            });
        }

        if (validationErrors.length > 0) {
            return next(new AppError('Validation error.', 400, validationErrors));
        }

        const task = await Task.findOne({ where: { id, userId: req.user.id } });

        if (!task) {
            return next(new AppError('Task not found.', 404));
        }

        await task.update({
            title:       title       !== undefined ? title.trim() : task.title,
            description: description !== undefined ? description  : task.description,
            status:      status      ?? task.status,
            due_date:    due_date    !== undefined ? due_date     : task.due_date
        });

        return res.status(200).json({
            success: true,
            message: 'Task updated successfully.',
            data: task
        });

    } catch (error) {
        next(error);
    }
};

// ─── DELETE TASK ───────────────────────────────────────────────────────────────

const deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;

        const task = await Task.findOne({ where: { id, userId: req.user.id } });

        if (!task) {
            return next(new AppError('Task not found.', 404));
        }

        await task.destroy();

        return res.status(200).json({
            success: true,
            message: 'Task deleted successfully.'
        });

    } catch (error) {
        next(error);
    }
};

// ─── SEED TASKS ────────────────────────────────────────────────────────────────

/**
 * Creates the 10 pre-defined eco-action tasks for the authenticated user.
 * Skips any task whose title already exists for this user (idempotent).
 * Route: POST /api/tasks/seed
 */
const seedTasks = async (req, res, next) => {
    try {
        const created = [];
        const skipped = [];

        for (const taskData of SAMPLE_ECO_TASKS) {
            // Check if this user already has a task with this title
            const existing = await Task.findOne({
                where: { title: taskData.title, userId: req.user.id }
            });

            if (existing) {
                skipped.push(taskData.title);
                continue;
            }

            const task = await Task.create({ ...taskData, userId: req.user.id });
            created.push(task);
        }

        const message = created.length > 0
            ? `${created.length} sample eco tasks created successfully.`
            : 'All sample tasks already exist for this user.';

        return res.status(201).json({
            success: true,
            message,
            created: created.length,
            skipped: skipped.length,
            data: created
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    seedTasks
};
