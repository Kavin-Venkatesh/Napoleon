const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const Batch = require('../src/models/batch.js');
const Offer = require('../src/models/offer.js');
const BatchRouter = require('../src/routes/batches.js');
const app = express();

app.use(express.json());
app.use('/batch', BatchRouter);

jest.mock('../src/models/batch.js');

describe('Batch Routes' , () =>{

    afterEach(()=>{
        jest.clearAllMocks();
    });

    describe('POST /batch/createBatch' , () =>{
        it( 'should succcessfully create a new batch' , async() =>{
            Batch.prototype.save.mockResolvedValue();

            const response = await request(app)
            .post('/batch/createBatch')
            .send({batchName : '2025 - 2026'});

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Batch created successfully');
        });

        it('should return 500 on failing to create a new batch' , async()=>{
            Batch.prototype.save.mockRejectedValue();

            const response = await request(app)
            .post('/batch/createBatch')
            .send({batchName : '2025 - 2026'});

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Something went wrong');
        })
    });

    describe('GET /batch/getBatch', () => {
        it('should return all the batches', async () => {
            // Mock `Batch.find` with expected return value
            Batch.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([
                    { batchName: '2025 - 2026', _id: new mongoose.Types.ObjectId().toString() }
                ])
            });

            const response = await request(app).get('/batch/getBatch');
    
            expect(response.status).toBe(200);
            expect(response.body).toEqual([
                { batchName: '2025 - 2026', _id: expect.any(String) }
            ]);
        });

        it('should return 500 on failing to retrieve batches', async () => {
            Batch.find.mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error('Database error')),
            });

            const response = await request(app)
            .get('/batch/getBatch');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Something went wrong');
        });


        it('should return 404 if no batches are found', async () => {
            Batch.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([]),
            });

            const response = await request(app)
            .get('/batch/getBatch');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('No batches found');
        }); 
    });

    describe('DELETE /batch/deleteBatch/:id', () => {
        it('should delete a batch and associated offers', async () => {
            const batchId = new mongoose.Types.ObjectId().toString();
    
            Batch.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: batchId });
            Offer.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });
    
            const response = await request(app).delete(`/batch/deleteBatch/${batchId}`);
    
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Batch and associated offers deleted successfully');
        });

        it('should return 500 on failing to delete a batch', async () => {
            Batch.findByIdAndDelete.mockRejectedValue();

            const response = await request(app)
            .delete(`/batch/deleteBatch/${new mongoose.Types.ObjectId()}`);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Something went wrong');
        });

        it('should return 404 if batch is not found', async () => {
            Batch.findByIdAndDelete.mockResolvedValue(null);

            const response = await request(app)
            .delete(`/batch/deleteBatch/${new mongoose.Types.ObjectId()}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Batch not found');
        });
    });


    describe('GET /batch/batchStudentDetails/:batchId', () => {
        it('should return all the approved or rejected students for a batch', async () => {
            const batchId = new mongoose.Types.ObjectId().toString();
            const mockOffers = [
                { _id: new mongoose.Types.ObjectId().toString(),
                    name: 'John Doe',
                    rollNo: '123',
                    branch: 'CSE',
                    companyName: 'ABC Corp',
                    companyCtc: '10 LPA',
                    status: 'Approved' 
                },
            ];
 
            Offer.find = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockOffers)
            });
    
            const response = await request(app)
            .get(`/batch/batchStudentDetails/${batchId}`);
    
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockOffers.map(offer => ({
                id: offer._id,
                name: offer.name,
                rollNo: offer.rollNo,
                branch: offer.branch,
                companyName: offer.companyName,
                salaryPackage: offer.companyCtc,
                status: offer.status
            })));
        });
    
        it('should return 500 on failing to retrieve student details', async () => {
            const batchId = new mongoose.Types.ObjectId().toString();
    

            Offer.find = jest.fn().mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error('Database error'))
            });
    
            const response = await request(app)
            .get(`/batch/batchStudentDetails/${batchId}`);
    
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Something went wrong');
        });
    
        it('should return 404 if no approved or rejected students are found', async () => {
            const batchId = new mongoose.Types.ObjectId().toString();
    
    
            Offer.find = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue([])
            });
    
            const response = await request(app)
            .get(`/batch/batchStudentDetails/${batchId}`);
    
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('No approved or rejected students found for this batch');
        });
    });
})
