const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../src/models/user');
const authRoutes = require('../src/routes/auth');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth API', () => {
    beforeAll(async () => {
        // Connect to a test database
        await mongoose.connect(`mongodb://127.0.0.1/auth_test_db`);
    });

    afterAll(async () => {
        // Disconnect from the test database
        await mongoose.connection.close();
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    test('POST /auth/register - success', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                name: 'Test User',
                registerNumber: '12345',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123',
                role: 'user'
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User created successfully');
    });

    test('POST /auth/register - passwords do not match', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                name: 'Test User',
                registerNumber: '12345',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password124',
                role: 'user'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Passwords do not match');
    });

    test('POST /auth/login - success', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = new User({
            name: 'Test User',
            registerNumber: '12345',
            email: 'test@example.com',
            password: hashedPassword,
            role: 'user'
        });
        await user.save();

        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Login successful');
        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe('test@example.com');
    });

    test('POST /auth/login - invalid credentials', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'password123'
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('User not found');
    });

    test('GET /auth/users - success', async () => {
        const user = new User({
            name: 'Test User',
            registerNumber: '12345',
            email: 'test@example.com',
            password: 'password123',
            role: 'user'
        });
        await user.save();

        const response = await request(app).get('/auth/users');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].email).toBe('test@example.com');
    });

    test('DELETE /auth/deleteusers - success', async () => {
        const user = new User({
            name: 'Test User',
            registerNumber: '12345',
            email: 'test@example.com',
            password: 'password123',
            role: 'user'
        });
        await user.save();

        const response = await request(app)
            .delete('/auth/deleteusers')
            .send({
                ids: [user._id]
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Users deleted successfully');
        expect(response.body.deletedCount).toBe(1);
    });
});