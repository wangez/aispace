require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');
const chatRoutes = require('./routes/chat');
const setRoutes = require('./routes/set');
const streamRoutes = require('./routes/stream');
const agentRoutes = require('./routes/agent');

const authMiddleware = require('./tools/authMiddleware');

require('./config/database')

const app = express();

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/set', setRoutes);
app.use(authMiddleware)
app.use('/api/history', historyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/agent', agentRoutes);

app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
})
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}`);
});