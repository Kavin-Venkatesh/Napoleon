const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const Offer = require('../src/models/offer.js');
const Batch = require('../src/models/batch.js');
const app = express();
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const offerRouter = require('../src/routes/offer.js');
const fs = require('fs-extra');

app.use(express.json());
app.use('/offer', upload.any(), offerRouter);

jest.mock('../src/models/offer.js'); 
jest.mock('../src/models/batch.js');

Offer.mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(),
}));

beforeAll(() => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    // Create dummy files for testing
    const testFiles = ['mailConfirmation.pdf', 'internshipLetter.pdf', 'letterOfIntent.pdf', 'offerLetter.pdf'];
    testFiles.forEach((file) => {
        fs.writeFileSync(path.join(uploadDir, file), 'dummy content');
    });
});

afterEach(async () => {
    jest.clearAllMocks();
    await fs.emptyDir(path.join(__dirname, 'uploads')); 
});

describe('Offer Routes', () => {
    
    describe('GET /offer/getoffers', () => {
        it('should get all offers for a user', async () => {
            const mockOffers = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'John Doe',
                    rollNo: '12345',
                    branch: 'CSE',
                    companyName: 'Tech Corp',
                    companyCtc: '50000',
                    status: 'Pending',
                },
            ];
            jest.spyOn(Offer, 'find').mockResolvedValue(mockOffers);

            const response = await request(app).get('/offer/getoffers').query({ userId: 'user123' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe('John Doe');
        });

        it('should return an error if no offers are found', async () => {
            jest.spyOn(Offer, 'find').mockResolvedValue([]);

            const response = await request(app).get('/offer/getoffers').query({ userId: 'user123' });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('No offers found');
        });
    });

    describe('GET /offer/detailsPage/:id', () => {
        it('should get offer details by ID', async () => {
            const mockOffer = {
                _id: new mongoose.Types.ObjectId(),
                name: 'John Doe',
                rollNo: '12345',
                branch: 'CSE',
                companyName: 'Tech Corp',
                companyCtc: '50000',
                status: 'Pending',
            };
            jest.spyOn(Offer, 'findById').mockResolvedValue(mockOffer);

            const response = await request(app).get(`/offer/detailsPage/${mockOffer._id}`);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('John Doe');
        });

        it('should return an error if offer is not found', async () => {
            jest.spyOn(Offer, 'findById').mockResolvedValue(null);

            const response = await request(app).get('/offer/detailsPage/invalidId');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Offer not found');
        });
    });

    describe('GET /offer/pendingOffers', () => {
        it('should get all pending offers', async () => {
            const mockOffers = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'John Doe',
                    rollNo: '12345',
                    branch: 'CSE',
                    companyName: 'Tech Corp',
                    companyCtc: '50000',
                    status: 'Pending',
                },
            ];
            jest.spyOn(Offer, 'find').mockResolvedValue(mockOffers);

            const response = await request(app).get('/offer/pendingOffers');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe('John Doe');
        });

        it('should return an error if no pending offers are found', async () => {
            jest.spyOn(Offer, 'find').mockResolvedValue([]);

            const response = await request(app).get('/offer/pendingOffers');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('No pending offers found');
        });
    });

    describe('GET /offer/pendingDetails/:id', () => {
        it('should get pending offer details by ID', async () => {
            const mockOffer = {
                _id: new mongoose.Types.ObjectId(),
                name: 'John Doe',
                rollNo: '12345',
                branch: 'CSE',
                companyName: 'Tech Corp',
                companyCtc: '50000',
                status: 'Pending',
            };
            jest.spyOn(Offer, 'findById').mockResolvedValue(mockOffer);

            const response = await request(app).get(`/offer/pendingDetails/${mockOffer._id}`);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('John Doe');
        });

        it('should return an error if pending offer is not found', async () => {
            jest.spyOn(Offer, 'findById').mockResolvedValue(null);

            const response = await request(app).get('/offer/pendingDetails/invalidId');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Offer not found');
        });
    });

    describe('PUT /offer/updateStatus/:id', () => {
        it('should update offer status', async () => {
            const mockOffer = {
                _id: new mongoose.Types.ObjectId(),
                name: 'John Doe',
                rollNo: '12345',
                branch: 'CSE',
                companyName: 'Tech Corp',
                companyCtc: '50000',
                status: 'Pending',
                save: jest.fn().mockResolvedValue(true),
            };
            jest.spyOn(Offer, 'findById').mockResolvedValue(mockOffer);

            const response = await request(app)
                .put(`/offer/updateStatus/${mockOffer._id}`)
                .send({ status: 'Approved' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Offer status updated successfully');
            expect(mockOffer.save).toHaveBeenCalled();
        });

        it('should return an error if offer ID is invalid', async () => {
            const response = await request(app)
            .put('/offer/updateStatus/invalid-id')
            .send({ status: 'Approved' });
                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Invalid offer ID');
        });

        it('should return an error if status is invalid', async () => {
            const mockOffer = {
                _id: new mongoose.Types.ObjectId(),
                name: 'John Doe',
                rollNo: '12345',
                branch: 'CSE',
                companyName: 'Tech Corp',
                companyCtc: '50000',
                status: 'Pending',
            };
            jest.spyOn(Offer, 'findById').mockResolvedValue(mockOffer);

            const response = await request(app)
                .put(`/offer/updateStatus/${mockOffer._id}`)
                .send({ status: 'InvalidStatus' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid status');
        });
    });
});