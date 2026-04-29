const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // 移除不再支持的选项
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
connectDB()