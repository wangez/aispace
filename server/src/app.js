require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/database');
const cors = require('cors');
// 导入路由
const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');
const chatRoutes = require('./routes/chat');
const setRoutes = require('./routes/set');
const embeddingRoutes = require('./routes/embedding');

const authMiddleware = require('./middleware/auth');

// 初始化Express应用
const app = express();
// 连接数据库
connectDB();

// 中间件
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use(authMiddleware)
app.use('/api/history', historyRoutes);
app.use('/api/set', setRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/embedding', embeddingRoutes);

// 404处理
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
})

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}`);
});