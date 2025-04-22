const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        console.log(`MongoDB connected !!`);
    } catch (err) {
        console.log("MONGODB connection error ", err);
        process.exit(1);
    }
};

module.exports = connectDB;