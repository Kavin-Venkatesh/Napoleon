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
        // console.log(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
}); 

router.get('/getBatch', async(req,res)=>{
    try{
        const batches = await Batch.find().select('batchName _id');
        if (!batches.length) {
            return res.status(404).json({ message: 'No batches found' });
        }
        res.json(batches);
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Something went wrong'})
    }
});

router.delete('/deleteBatch/:id', async (req, res) => {
    try {
        const batchId = req.params.id;
        const batch = await Batch.findByIdAndDelete(batchId);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        await Offer.deleteMany({ batch: batchId });
        res.status(200).json({ message: 'Batch and associated offers deleted successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
});

router.get('/batchStudentDetails/:batchId', async (req, res) => {
    try {
        const batchId = req.params.batchId;
        const offers = await Offer.find({ 
            batch: batchId,
            status: { $in: ['Approved', 'Rejected'] }
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
        
        console.log('Offers length', offers.length);
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
        const labelWidth = 150; 

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
            yPosition -= 10;

            for (const proof of offer.availableProofs) {
                if (proof.filePath) {
                    yPosition -= lineHeight;

                    try {
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
                    } catch (proofError) {
                        console.error(`Error processing proof for offer ${offer.rollNo}:`, proofError);
                        page.drawText(`Error processing proof: ${proofError.message}`, {
                            x: margin,
                            y: yPosition,
                            size: 10,
                            font: courierFont,
                            color: rgb(1, 0, 0),
                        });
                        yPosition -= lineHeight;
                    }
                }
            }
        }

        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=students_details.pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (err) {
        console.error('Error generating PDF:', err);
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
