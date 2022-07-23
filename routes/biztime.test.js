process.send.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
let invoiceData;

// Set Up

beforeEach(async () => {
    const companyResponse = await db.query(
        `INSERT INTO companies (code, name, description)
        VALUES ('spotify', 'Spotify', 'Swedish audio streaming company')
        RETURNING *`
    );
    testCompany = companyResponse.rows[0];
    const invoiceResponse = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, paid_date)
        VALUES ('spotify', 1000, false, null)
        RETURNING *`
    );
    invoiceData = invoiceResponse.rows;
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
    await db.end();
});

// companies.js Tests

describe('GET /companies', () => {
    test('Get a list of companies.', async () => {
        const response = await request(app).get('/companies');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ companies: [testCompany] });
    });
});

describe('GET /companies/:code', () => {
    test('Get a single company.', async () => {
        const response = await request(app).get(
            `/companies/${testCompany.code}`
        );
        testCompany.invoiceData = invoiceData.map((invoice) => invoice.id);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ company: testCompany });
    });
    test('Responds with an error for an invalid company.', async () => {
        const response = await request(app).get(`/companies/netflix`);
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
            error: {
                message: 'Company with code of netflix does not exist.',
                status: 404,
            },
        });
    });
});

describe('POST /companies', () => {
    test('Posts a new company.', async () => {
        const response = await request(app).post('/companies').send({
            code: 'google',
            name: 'Google',
            description: 'Worlds most popular search engine.',
        });
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({
            company: {
                code: 'google',
                name: 'Google',
                description: 'Worlds most popular search engine.',
            },
        });
    });
});

describe('PUT /companies/code', () => {
    test('Updates a company.', async () => {
        const response = await request(app)
            .put(`/companies/${testCompany.code}`)
            .send({
                name: 'Updated company name',
                description: 'this is a test',
            });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            company: {
                code: 'spotify',
                name: 'Updated company name',
                description: 'this is a test',
            },
        });
    });
    test('Responds with 404 for invalid company.', async () => {
        const response = await request(app).put(`/companies/netflix`).send({
            name: 'Updated company name',
            description: 'this is a test',
        });
        expect(response.statusCode).toBe(404);
    });
});

describe('DELETE /companies/:code', () => {
    test('Deletes a company', async () => {
        const response = await request(app).delete(
            `/companies/${testCompany.code}`
        );
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ status: 'deleted' });
    });
});
