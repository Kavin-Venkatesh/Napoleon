const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
    batchName :{
        type : String,
        required : true,
    }
});

module.exports = mongoose.model('Batches', BatchSchema);
