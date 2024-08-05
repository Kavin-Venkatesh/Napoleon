const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
    year :{
        type : String,
        required : true,
    },
    totalStudents :{
        type : Number,
        required : true,
    },
    studentsPlaced :{
        type : Number,
        required : true,
    },
    studentsInterest :{
        type : Number,
        required : true,
    },
    studentsNotInterest:{
        type : Number,
        required : true,
    },
    studentsNotPlaced :{
        type : Number,
        required : true,
    },
    NumberofCompanies:{
        type : Number,
        required : true,
    },
    NumberofOffers :{
        type : Number,
        required : true,
    },
    PlacementPercentage:{
        type : Number,
        required : true,
    },
    avSalary :{
        type : Number,
        required : true,
    },
    highSalary:{
        type : Number,
        required : true,
    },
    lowSalary:{
        type : Number,
        required : true,
    },
    proofCount:{
        type : Number,
        required : true,
    }
});

module.exports = mongoose.model('Batch', BatchSchema);