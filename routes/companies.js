const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({ companies: results.rows });
    } catch (err) {
        return next(err);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const companyResults = await db.query(
            `SELECT * FROM companies WHERE code=$1`,
            [code]
        );
        const invoicesResults = await db.query(
            `SELECT id FROM invoices WHERE comp_code=$1`,
            [code]
        );

        if (companyResults.rows.length === 0) {
            throw new ExpressError(
                `Company with code of ${code} does not exist.`,
                404
            );
        }

        const companyData = companyResults.rows[0];
        const invoiceData = invoicesResults.rows;

        companyData.invoiceData = invoiceData.map((invoice) => invoice.id);

        return res.json({ company: companyData });
    } catch (err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
        const results = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [code, name, description]
        );
        return res.status(201).json({ company: results.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const results = await db.query(
            `UPDATE companies
            SET name=$1, description=$2
            WHERE code=$3
            RETURNING *`,
            [name, description, code]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(
                `Company with code of ${code} does not exist.`,
                404
            );
        }
        return res.send({ company: results.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const results = await db.query(
            `DELETE FROM companies
            WHERE code=$1`,
            [req.params.code]
        );
        return res.send({ status: 'deleted' });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
