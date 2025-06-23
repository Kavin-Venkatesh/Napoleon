const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const Analytics = require('../src/models/analytics.js');
const AnalyticsRouter = require('../src/routes/analytics.js');
const app = express();

app.use(express.json());
app.use('/analytics', AnalyticsRouter);

jest.mock('../src/models/analytics.js');

describe('Analytics Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /analytics/addBatch', () => {
        it('should successfully create a new Batch for Analytics', async () => {
            Analytics.prototype.save.mockResolvedValue();

            const response = await request(app)
                .post('/analytics/addBatch')
                .send({
                    year: "2022 - 2026",
                    totalStudents: 2500,
                    studentsPlaced: 2000,
                    studentsInterest: 2000,
                    studentsNotInterest: 500,
                    studentsNotPlaced: 0,
                    NumberofCompanies: 450,
                    NumberofOffers: 1800,
                    PlacementPercentage: 100,
                    avSalary: 5,
                    highSalary: 45,
                    lowSalary: 5,
                    proofCount: 2000
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Batch created successfully');
        });

        it('should return 500 on failing to create a new Analytics', async () => {
            jest.spyOn(Analytics.prototype, 'save').mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/analytics/addBatch')
                .send({
                    year: "2022 - 2026",
                    totalStudents: 2500,
                    studentsPlaced: 2000,
                    studentsInterest: 2000,
                    studentsNotInterest: 500,
                    studentsNotPlaced: 0,
                    NumberofCompanies: 450,
                    NumberofOffers: 1800,
                    PlacementPercentage: 100,
                    avSalary: 5,
                    highSalary: 45,
                    lowSalary: 5,
                    proofCount: 2000
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Something went wrong');
        });
    });

    describe('GET /analytics/getBatch', () => {
        it('should return all batches', async () => {
            const mockBatches = [
                { year: '2022 - 2026', _id: new mongoose.Types.ObjectId().toString() }
            ];

            Analytics.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockBatches)
            });

            const response = await request(app).get('/analytics/getBatch');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockBatches);
        });

        it('should return 500 on failing to retrieve batches', async () => {
            Analytics.find.mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            const response = await request(app).get('/analytics/getBatch');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Something went wrong');
        });
    });

    describe('GET /analytics/getBatch/:id', () => {
        it('should return a batch by id', async () => {
            const mockBatch = { year: '2022 - 2026', _id: new mongoose.Types.ObjectId().toString() };

            Analytics.findById.mockResolvedValue(mockBatch);

            const response = await request(app).get(`/analytics/getBatch/${mockBatch._id}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockBatch);
        });

        it('should return 500 on failing to retrieve a batch by id', async () => {
            Analytics.findById.mockRejectedValue(new Error('Database error'));

            const response = await request(app).get(`/analytics/getBatch/${new mongoose.Types.ObjectId().toString()}`);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Something went wrong');
        });
    });

    describe('DELETE /analytics/deleteAnalytics/:id', () => {
        it('should delete a batch by id', async () => {
            const batchId = new mongoose.Types.ObjectId().toString();

            Analytics.findByIdAndDelete.mockResolvedValue({ _id: batchId });

            const response = await request(app).delete(`/analytics/deleteAnalytics/${batchId}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Batch Analytics deleted Successfully');
        });

        it('should return 404 if batch not found', async () => {
            const batchId = new mongoose.Types.ObjectId().toString();

            Analytics.findByIdAndDelete.mockResolvedValue(null);

            const response = await request(app).delete(`/analytics/deleteAnalytics/${batchId}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Batch not found');
        });

        it('should return 500 on failing to delete a batch by id', async () => {
            Analytics.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

            const response = await request(app).delete(`/analytics/deleteAnalytics/${new mongoose.Types.ObjectId().toString()}`);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Something went wrong');
        });
    });
});