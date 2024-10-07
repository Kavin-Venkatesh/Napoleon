const mongoose = require('mongoose');
const Batch = require('./batch');

const ProofSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['mail confirmation', 'Internship letter', 'letter of intent', 'offer letter'],
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    originalFileName: {
        type: String,
        required: true
    }
});

const OfferSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required : true
    },
    name :{
        type : String,
        required : true,
    },
    rollNo :{
        type : String,
        required : true,
    },
    Gender :{
        type : String,
        required : true,
    },
    dob :{
        type : Date,
        required : true,
    },
    mobile :{
        type : Number,
        required : true,
    },
    degree:{
        type : String,
        required : true,
    },
    branch :{
        type : String,
        required : true,
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch', 
        required: true,
    },
    batchName: {
        type: String,
        required: true
    },
    companyName :{
        type : String,
        required : true,
    },
    companyCategory :{
        type : String,
        required : true,
    },
    organizedBy :{
        type : String,
        required : true,
    },
    companyLocation :{
        type : String,
        required : true,
    },
    internshipDate :{
        type : Date,
        required : true,
    },
    stipend:{
        type : Number,
        required : true,
    },
    companyCtc:{
        type : Number,
        required : true,
    },
    placedDate :{
        type : Date,
        required : true,
    },
    availableProofs: {
        type: [ProofSchema],
        validate: [arrayLimit, '{PATH} must have at least one proof']
    }, 
    status: {
        type: String,
        default: 'Pending'
    },
    rejectedReason: {
        type: String,
        default: ''
    }
});

function arrayLimit(val) {
    return val.length > 0;
}
module.exports = mongoose.model('Offer', OfferSchema);

