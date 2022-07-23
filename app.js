/** BizTime express application. */
const express = require('express');
const app = express();
const ExpressError = require('./expressError');

app.use(express.json());

// Routers

const companyRouter = require('./routes/companies');
const invoiceRouter = require('./routes/invoices');

app.use('/companies', companyRouter);
app.use('/invoices', invoiceRouter);

/** 404 handler */

app.use(function (req, res, next) {
    const err = new ExpressError('Not Found', 404);
    return next(err);
});

/** general error handler */

app.use(function (err, req, res, next) {
    let status = err.status || 500;

    return res.status(status).json({
        error: {
            message: err.message,
            status: status,
        },
    });
});

module.exports = app;
