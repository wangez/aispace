// models/Counter.js
// 计数器，用于对话列表order字段自增长
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    // 用于标识这个计数器是为哪个模型/字段服务的
    _id: { type: String, required: true },
    // 当前序列值
    seq: { type: Number, default: 1 }
});

module.exports = mongoose.model('Counter', counterSchema);