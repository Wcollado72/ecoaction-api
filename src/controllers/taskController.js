const { Op, fn, col, where } = require('sequelize');
const Task = require('../models/Task');
const AppError = require('../utils/appError');

const validStatuses = ['pending', 'in_progress', 'done'];

const createTask = async (req, res, next) => {
    try {
        const { title, description, status, due_date } = req.body;
        const validationErrors = [];

        if (!title || !title.trim()) {
            validationErrors.push({
                field: 'title',
                message: 'Title is required.'
            });
        }

        if (status && !validStatuses.includes(status)) {
            validationErrors.push({
                field: 'status',
                message: 'Invalid status value. Allowed values: pending, in_progress, done.'
            });
        }

        if (validationErrors.length > 0) {
            return next(new AppError('Validation error.', 400, validationErrors));
        }

        const newTask = await Task.create({
            title: title.trim(),
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
                return next(new AppError('Validation error.', 400, [
                    {
                        field: 'status',
                        message: 'Invalid status value. Allowed values: pending, in_progress, done.'
                    }
                ]));
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
            return next(new AppError('Task not found.', 404));
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
        const validationErrors = [];

        if (title !== undefined && !title.trim()) {
            validationErrors.push({
                field: 'title',
                message: 'Title cannot be empty.'
            });
        }

        if (status && !validStatuses.includes(status)) {
            validationErrors.push({
                field: 'status',
                message: 'Invalid status value. Allowed values: pending, in_progress, done.'
            });
        }

        if (validationErrors.length > 0) {
            return next(new AppError('Validation error.', 400, validationErrors));
        }

        const task = await Task.findOne({
            where: {
                id,
                userId: req.user.id
            }
        });

        if (!task) {
            return next(new AppError('Task not found.', 404));
        }

        await task.update({
            title: title !== undefined ? title.trim() : task.title,
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

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
};