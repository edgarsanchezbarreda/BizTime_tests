const express = require('express');
const date = require('date-and-time');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');
const { DatabaseError } = require('pg');

const now = new Date();
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
        const { amt, paid } = req.body;
        let paidDate = null;

        const currentResult = await db.query(
            `SELECT paid
            FROM invoices
            WHERE id = $1`,
            [id]
        );

        if (currentResult.rows.length === 0) {
            throw new ExpressError(`No such invoice ${id}`, 404);
        }
        const currentPaidDate = currentResult.rows[0].paid_date;

        if (!currentPaidDate && paid) {
            paidDate = new Date();
        } else if (!paid) {
            paidDate = null;
        } else {
            paidDate = currentPaidDate;
        }

        const results = await db.query(
            `UPDATE invoices
			SET amt=$1, paid=$2, paid_date=$3
			WHERE id=$4
			RETURNING *`,
            [amt, paid, paidDate, id]
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
