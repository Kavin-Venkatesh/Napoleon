const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    registerNumber: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user'
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        required: function() { return this.role === 'student'; }
    },
    batchName: {
        type: String,
        required: function() { return this.role === 'student'; }
    }
});

module.exports = mongoose.model('User', UserSchema);