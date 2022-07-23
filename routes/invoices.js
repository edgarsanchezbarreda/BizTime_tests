const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

// Routes

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.json({ invoices: results.rows });
    } catch (err) {
        return next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query(
            `SELECT 
			invoices.id, 
			invoices.comp_code, 
			invoices.amt, 
			invoices.paid,
			invoices.add_date,
			invoices.paid_date,
			companies.code,
			companies.name,
			companies.description
			FROM invoices
			INNER JOIN companies
			ON invoices.comp_code=companies.code
			WHERE id=$1`,
            [id]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(
                `Invoice with id of ${id} does not exist.`,
                404
            );
        }
        const data = results.rows[0];
        const invoice = {
            id: data.id,
            comp_code: data.comp_code,
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
            company: {
                code: data.code,
                name: data.name,
                description: data.description,
            },
        };
        return res.send({ invoice: invoice });
    } catch (err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt)
			VALUES ($1, $2)
			RETURNING *`,
            [comp_code, amt]
        );
        return res.status(201).json({ invoice: results.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt } = req.body;
        const results = await db.query(
            `UPDATE invoices
			SET amt=$1
			WHERE id=$2
			RETURNING *`,
            [amt, id]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(
                `Invoice with id of ${id} does not exist.`,
                404
            );
        }
        return res.send({ invoice: results.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const results = await db.query(
            `DELETE FROM invoices
			WHERE id=$1`,
            [req.params.id]
        );
        return res.send({ status: 'deleted' });
    } catch (err) {
        return next(err);
    }
});

// Router
module.exports = router;
