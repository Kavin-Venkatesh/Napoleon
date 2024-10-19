const express = require('express');
const Analytics = require('../models/analytics');
const router = express.Router();

router.post('/addBatch', async (req, res) => {
    try {
        const { year, totalStudents, studentsPlaced, studentsInterest, studentsNotInterest, studentsNotPlaced, NumberofCompanies, NumberofOffers, PlacementPercentage, avSalary, highSalary, lowSalary, proofCount } = req.body;
        const batch = new Analytics({ year, totalStudents, studentsPlaced, studentsInterest, studentsNotInterest, studentsNotPlaced, NumberofCompanies, NumberofOffers, PlacementPercentage, avSalary, highSalary, lowSalary, proofCount });
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
        const batches = await Analytics.find().select('year _id');
        res.json(batches);
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Something went wrong'})
    }
});

router.get('/getBatch/:id', async(req,res)=>{
    try{
        const batch = await Analytics.findById(req.params.id);
        res.json(batch);
    }
    catch(err){
        console.log(err);
        res.status(500).json({message : 'Something went wrong'})
    }
});


router.delete('/deleteAnalytics/:id', async(req, res) =>{
    try{
        const batchId = req.params.id;
        const batch =  await Analytics.findByIdAndDelete(batchId);

        if(!batch){
            return res.status(404).json({message : "Batch not found"});
        }
        res.status(200).json({ message : "Batch Analytics deleted Successfully"})
    }catch (err){
        console.log(err);
        res.status(500).json({message : "Something went wrong"});
    }
})


module.exports = router;
