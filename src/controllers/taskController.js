const { Op, fn, col, where } = require('sequelize');
const Task = require('../models/Task');

const validStatuses = ['pending', 'in_progress', 'done'];

const createTask = async (req, res, next) => {
    try {
        const { title, description, status, due_date } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Title is required.'
            });
        }

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value. Allowed values: pending, in_progress, done.'
            });
        }

        const newTask = await Task.create({
            title,
            description,
            status: status || 'pending',
            due_date,
            userId: req.user.id
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

const getTasks = async (req, res, next) => {
    try {
        const { status, due_date } = req.query;

        const whereClause = {
            userId: req.user.id
        };

        if (status) {
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status value. Allowed values: pending, in_progress, done.'
                });
            }

            whereClause.status = status;
        }

        const queryOptions = {
            where: whereClause,
            order: [['createdAt', 'DESC']]
        };

        if (due_date) {
            queryOptions.where = {
                ...whereClause,
                [Op.and]: [
                    where(fn('DATE', col('due_date')), due_date)
                ]
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

const getTaskById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const task = await Task.findOne({
            where: {
                id,
                userId: req.user.id
            }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

const updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, status, due_date } = req.body;

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value. Allowed values: pending, in_progress, done.'
            });
        }

        const task = await Task.findOne({
            where: {
                id,
                userId: req.user.id
            }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
        }

        await task.update({
            title: title ?? task.title,
            description: description ?? task.description,
            status: status ?? task.status,
            due_date: due_date ?? task.due_date
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

const deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;

        const task = await Task.findOne({
            where: {
                id,
                userId: req.user.id
            }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
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

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
};