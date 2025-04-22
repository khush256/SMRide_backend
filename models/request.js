const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const requestSchema = new mongoose.Schema({
    requestID: { type: String, default: uuidv4, unique: true },
    userId: { type: String, required: true },
    location: { type: String, required: true },
    time: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);