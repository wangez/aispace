// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 0.5, // 文档在 0.5 小时后自动删除（单位：秒）
    },
});

module.exports = mongoose.model('Session', sessionSchema);