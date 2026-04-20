const mongoose = require('mongoose');

const busConnection = mongoose.createConnection(process.env.MONGODB_URI + '/bus_db');

const connectDB = async () => {
    try {
        // 移除不再支持的选项
        await mongoose.connect(process.env.MONGODB_URI + '/system_db');
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = { busConnection, connectDB };