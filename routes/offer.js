const express = require('express');
const mongoose = require('mongoose');
const Offer = require('../models/offer');
const multer = require('multer');
const path = require('path');
const Batch = require('../models/batch');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const axios = require('axios');
const fs = require('fs');
const router = express.Router();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/addOffer', upload.fields([
    { name: 'mailConfirmationFile', maxCount: 1 },
    { name: 'internshipLetterFile', maxCount: 1 },
    { name: 'letterOfIntentFile', maxCount: 1 },
    { name: 'offerLetterFile', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            name,
            registerNumber,
            gender,
            dob,
            mobileNumber,
            degree,
            branch,
            batchName,
            companyName,
            companyCategory,
            organizedBy,
            companyLocation,
            internshipDate,
            stipend,
            salary,
            placedDate,
            userId
        } = req.body;

        const files = req.files;

        const batch = await Batch.findOne({ name: batchName });
        if (!batch) {
            return res.status(400).json({ message: 'Invalid batch name' });
        }

        const proofs = [];
        if (files.mailConfirmationFile) {
            proofs.push({
                type: 'mail confirmation',
                filePath: files.mailConfirmationFile[0].path,
                fileType: files.mailConfirmationFile[0].mimetype,
                originalFileName: files.mailConfirmationFile[0].originalname
            });
        }
        if (files.internshipLetterFile) {
            proofs.push({
                type: 'Internship letter',
                filePath: files.internshipLetterFile[0].path,
                fileType: files.internshipLetterFile[0].mimetype,
                originalFileName: files.internshipLetterFile[0].originalname
            });
        }
        if (files.letterOfIntentFile) {
            proofs.push({
                type: 'letter of intent',
                filePath: files.letterOfIntentFile[0].path,
                fileType: files.letterOfIntentFile[0].mimetype,
                originalFileName: files.letterOfIntentFile[0].originalname
            });
        }
        if (files.offerLetterFile) {
            proofs.push({
                type: 'offer letter',
                filePath: files.offerLetterFile[0].path,
                fileType: files.offerLetterFile[0].mimetype,
                originalFileName: files.offerLetterFile[0].originalname
            });
        }

        const offer = new Offer({
            userId,
            name,
            rollNo: registerNumber,
            Gender: gender,
            dob: dob,
            mobile: mobileNumber,
            degree,
            branch,
            batch: batch._id, 
            batchName: batch.batchName,  
            companyName,
            companyCategory,
            organizedBy,
            companyLocation,
            internshipDate,
            stipend,
            companyCtc: salary,
            placedDate,
            availableProofs: proofs,
            status: 'Pending',
            rejectedReason: ''
        });
        await offer.save();

        res.json({ message: 'Offer created successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Something went wrong' });
    }
});



router.get('/getoffers', async (req, res) => {
    try {
        const userId = req.query.userId;
        const offers = await Offer.find({ userId: userId });

        if (!offers || offers.length === 0) {
            return res.status(404).json({ message: 'No offers found' });
        }

        const formattedOffers = offers.map((offer, index) => ({
            SNo: index + 1,
            name: offer.name,
            rollNumber: offer.rollNo,
            branch: offer.branch,
            companyName: offer.companyName,
            salaryPackage: offer.companyCtc,
            status: offer.status,
            studentid: offer._id
        }));
        res.json(formattedOffers);
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ message: 'Failed to fetch offers' });
    }
});

router.get('/detailsPage/:id', async (req, res) => {
    try {
        const offerId = req.params.id;

        // Fetch the offer document
        const offer = await Offer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        res.json(offer);
    } catch (error) {
        console.error('Error fetching offer details:', error);
        res.status(500).json({ message: 'Failed to fetch offer details' });
    }
});


router.get('/downloadPDF/:id', async (req, res) => {
    try {
        console.log('Download PDF');
        console.log(req.params.id);
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        const externalFilesPath = path.join('C:', 'ExternalFiles');
        if (!fs.existsSync(externalFilesPath)) {
            fs.mkdirSync(externalFilesPath, { recursive: true });
        }

        const pdfDoc = await PDFDocument.create();
        const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
        const page = pdfDoc.addPage([595, 842]); // A4 size
        const { width, height } = page.getSize();
        const margin = 50;

        // Add header
        page.drawText('Offer Details', {
            x: margin,
            y: height - margin,
            size: 20,
            font: courierFont,
            color: rgb(0, 0, 0),
        });

        // Add offer details
        const details = [
            { label: 'Name:', value: offer.name },
            { label: 'Roll Number:', value: offer.rollNo },
            { label: 'Gender:', value: offer.Gender },
            { label: 'Date of Birth:', value: offer.dob.toISOString().split('T')[0] },
            { label: 'Mobile Number:', value: offer.mobile },
            { label: 'Degree:', value: offer.degree },
            { label: 'Branch:', value: offer.branch },
            { label: 'Batch:', value: offer.batch },
            { label: 'Company Name:', value: offer.companyName },
            { label: 'Company Category:', value: offer.companyCategory },
            { label: 'Placement Organized By:', value: offer.organizedBy },
            { label: 'Company Location:', value: offer.companyLocation },
            { label: 'Internship Date:', value: offer.internshipDate.toISOString().split('T')[0] },
            { label: 'Placed Date:', value: offer.placedDate.toISOString().split('T')[0] },
            { label: 'Stipend:', value: offer.stipend },
            { label: 'Company CTC:', value: offer.companyCtc },
            { label: 'Status:', value: offer.status },
        ];

        if (offer.status === 'Rejected') {
            details.push({ label: 'Rejected Reason:', value: offer.rejectedReason });
        }

        let yPosition = height - margin - 40;
        const lineHeight = 20;
        const labelWidth = 150; // Fixed width for labels

        details.forEach((detail) => {
            page.drawText(detail.label, {
                x: margin,
                y: yPosition,
                size: 12,
                font: courierFont,
                color: rgb(0, 0, 0),
            });
            page.drawText(String(detail.value), { // Convert value to string
                x: margin + labelWidth,
                y: yPosition,
                size: 12,
                font: courierFont,
                color: rgb(0, 0, 0),
            });
            yPosition -= lineHeight;
        });

        // Add proofs
        for (const proof of offer.availableProofs) {
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
            } catch (axiosError) {
                console.error('Error downloading proof file:', axiosError);
                const errorPage = pdfDoc.addPage();
                errorPage.drawText(`Error downloading proof file: ${proof.filePath}`, { x: margin, y: height - margin });
            }
        }

        const pdfBytes = await pdfDoc.save();
        const fileName = `${offer.rollNo}_offerdetails.pdf`;
        const filePath = path.join(externalFilesPath, fileName);

        fs.writeFileSync(filePath, pdfBytes);

        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).json({ message: 'Error downloading file', error: err });
            } else {
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
//Route to get all pending offers 
router.get('/pendingOffers' , async(req , res)=>{
    try {
        const pendingOffers = await Offer.find({ status : 'Pending'});
        if (!pendingOffers || pendingOffers.length === 0) {
            return res.status(404).json({ message: 'No pending offers found' });
        }

        const filteredOffers = pendingOffers.map((offer , index) =>(
            {   
                id : offer._id,
                name : offer.name,
                rollNumber : offer.rollNo,
                branch : offer.branch,
                companyName : offer.companyName,
                salaryPackage : offer.companyCtc,
                status : offer.status,
    
            }));

            res.status(200).json(filteredOffers);
    }
    catch{
        console.error('Error fetching pending offers:', error);
        res.status(500).json({ message: 'Failed to fetch pending offers' });
    }
})


router.get('/pendingDetails/:id', async (req, res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        res.json(offer);
    } catch (error) {
        console.error('Error fetching offer details:', error);
        res.status(500).json({ message: 'Failed to fetch offer details' });
    }
});

// Define a PUT route to update offer status by _id
router.put('/updateStatus/:id', async (req, res) => {
    try {
        const offerId = req.params.id;
        const { status, rejectedReason } = req.body;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(offerId)) {
            return res.status(400).json({ message: 'Invalid offer ID' });
        }

        // Validate status
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        offer.status = status;
        if (status === 'Rejected') {
            offer.rejectedReason = rejectedReason;
        } else {
            offer.rejectedReason = undefined;
        }

        // Save the updated offer
        await offer.save();

        res.status(200).json({ message: 'Offer status updated successfully', offer });
    } catch (error) {
        console.error('Error updating offer status:', error);
        res.status(500).json({ message: 'Failed to update offer status' });
    }
});

module.exports = router;