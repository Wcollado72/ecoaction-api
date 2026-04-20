const errorHandler = (err, req, res, next) => {
    console.error('Global error handler:', err);

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error.',
            errors: err.errors.map(error => ({
                field: error.path,
                message: error.message
            }))
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Duplicate value error.',
            errors: err.errors.map(error => ({
                field: error.path,
                message: error.message
            }))
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Internal server error.'
    });
};

module.exports = errorHandler;