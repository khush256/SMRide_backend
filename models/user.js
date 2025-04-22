const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
    token: { type: String, default: uuidv4, unique: true },
    name: { type: String },
    branch: { type: String },
    year: { type: String },
    phone: { type: String },
    vehicleNo: { type: String },
    acceptedRides: { type: [Map], default: [] },
    otp: { type: String },
    otpExpires: { type: Date },
    isProfileComplete: { type: Boolean, default: false }
});

userSchema.pre('save', function (next) {
    console.log('Checking if profile is complete...');
    if (this.name && this.branch && this.year) {
        console.log('Yes complete...');

        this.isProfileComplete = true;
    } else {
        console.log('Not complete...');

        this.isProfileComplete = false;
    }
    next();
})

module.exports = mongoose.model('User', userSchema);