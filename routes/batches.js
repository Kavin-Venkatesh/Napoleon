const express = require('express');
const mongoose = require('mongoose');
const Batch = require('../models/batch');
const Offer = require('../models/offer');
const { PDFDocument , StandardFonts , rgb} = require('pdf-lib');
const ExcelJS = require('exceljs');
const axios = require('axios');

const router = express.Router();

router.post('/createBatch', async (req, res) => {
    try {
        const { batchName } = req.body;
        const batch = new Batch({ batchName });
        await batch.save();
        res.json({ message: 'Batch created successfully' ,batch});
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
}); 

router.get('/getBatch', async(req,res)=>{
    try{
        const batches = await Batch.find().select('batchName _id');
        res.json(batches);
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Something went wrong'})
    }
});


router.get('/batchStudentDetails/:batchId', async (req, res) => {
    try {
        const batchId = req.params.batchId;
        const offers = await Offer.find({ 
            batch: batchId,
            status: { $in: ['Approved', 'Rejected'] } // Filter by approved and rejected statuses
        }).select('name rollNo branch companyName companyCtc status');

        if (!offers.length) {
            return res.status(404).json({ message: 'No approved or rejected students found for this batch' });
        }

        const studentDetails = offers.map(offer => ({
            id: offer._id,
            name: offer.name,
            rollNo: offer.rollNo,
            branch: offer.branch,
            companyName: offer.companyName,
            salaryPackage: offer.companyCtc,
            status: offer.status
        }));

        res.json(studentDetails);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
});

router.post('/download/pdf', async (req, res) => {
    try {
        const { batchId, selectedFields } = req.body;
        const offers = await Offer.find({ 
            batch: batchId,
            status: { $in: ['Approved', 'Rejected'] }
        }).select(selectedFields.join(' ')).populate('availableProofs');

        if (!offers.length) {
            return res.status(404).json({ message: 'No approved or rejected students found for this batch' });
        }

        const batch = await Batch.findById(batchId);
        const pdfDoc = await PDFDocument.create();
        const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
        const page = pdfDoc.addPage([595, 842]); // A4 size
        const { width, height } = page.getSize();
        const margin = 50;

        // Add header
        page.drawText(`Students Offer Details Batch - ${batch.batchName}`, {
            x: margin,
            y: height - margin,
            size: 20,
            font: courierFont,
            color: rgb(0, 0, 0),
        });

        let yPosition = height - margin - 40;
        const lineHeight = 15;
        const labelWidth = 150; // Fixed width for labels

        for (const offer of offers) {
            selectedFields.forEach(field => {
                page.drawText(`${field}: ${offer[field]}`, {
                    x: margin,
                    y: yPosition,
                    size: 10,
                    font: courierFont,
                    color: rgb(0, 0, 0),
                });
                yPosition -= lineHeight;
            });
            yPosition -= 20;

            for (const proof of offer.availableProofs) {
                if (proof.filePath) {
                    page.drawText(`Proof - ${offer.rollNo}`, {
                        x: margin,
                        y: yPosition,
                        size: 10,
                        font: courierFont,
                        color: rgb(0, 0, 0),
                    });
                    yPosition -= lineHeight;

                    if (proof.fileType === 'application/pdf') {
                        const response = await axios.get(`http://localhost:5000/${proof.filePath}`, { responseType: 'arraybuffer' });
                        const proofPdfBytes = response.data;
                        const proofPdfDoc = await PDFDocument.load(proofPdfBytes);
                        const copiedPages = await pdfDoc.copyPages(proofPdfDoc, proofPdfDoc.getPageIndices());
                        copiedPages.forEach((copiedPage) => {
                            pdfDoc.addPage(copiedPage);
                        });
                    } else if (proof.fileType.startsWith('image/')) {
                        const response = await axios.get(`http://localhost:5000/${proof.filePath}`, { responseType: 'arraybuffer' });
                        let img;
                        if (proof.fileType === 'image/png') {
                            img = await pdfDoc.embedPng(response.data);
                        } else if (proof.fileType === 'image/jpeg') {
                            img = await pdfDoc.embedJpg(response.data);
                        } else {
                            throw new Error('Unsupported image format');
                        }
                        const imgPage = pdfDoc.addPage();
                        imgPage.drawImage(img, {
                            x: margin,
                            y: height - img.height / 2 - margin,
                            width: img.width / 2,
                            height: img.height / 2,
                        });
                    }
                }
            }
        }

        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=students_details.pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
});

// Route to generate and download Excel
router.post('/download/excel', async (req, res) => {
    try {
        const { batchId, selectedFields } = req.body;
        const offers = await Offer.find({ 
            batch: batchId,
            status: { $in: ['Approved', 'Rejected'] }
        }).select(selectedFields.join(' '));

        if (!offers.length) {
            return res.status(404).json({ message: 'No approved or rejected students found for this batch' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Students Details');

        worksheet.columns = selectedFields.map(field => ({ header: field, key: field }));

        offers.forEach(offer => {
            const row = {};
            selectedFields.forEach(field => {
                row[field] = offer[field];
            });
            worksheet.addRow(row);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students_details.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
});


module.exports = router;
