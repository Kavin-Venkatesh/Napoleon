const express = require('express');
const Batch = require('../models/batch');
const router = express.Router();

router.post('/addBatch', async (req, res) => {
    try {
        const { year, totalStudents, studentsPlaced, studentsInterest, studentsNotInterest, studentsNotPlaced, NumberofCompanies, NumberofOffers, PlacementPercentage, avSalary, highSalary, lowSalary, proofCount } = req.body;
        const batch = new Batch({ year, totalStudents, studentsPlaced, studentsInterest, studentsNotInterest, studentsNotPlaced, NumberofCompanies, NumberofOffers, PlacementPercentage, avSalary, highSalary, lowSalary, proofCount });
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
        const batches = await Batch.find().select('year _id');
        res.json(batches);
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Something went wrong'})
    }
});

router.get('/getBatch/:id', async(req,res)=>{
    try{
        const batch = await Batch.findById(req.params.id);
        res.json(batch);
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Something went wrong'})
    }
});


module.exports = router;
