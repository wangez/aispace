const mongoose = require('mongoose');

const LongTermMemorySchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true }, // 关联用户
        role: { type: String, required: true, index: true }, // 关联角色
        summary: { type: String, default: '' },                // 对话整体摘要
        facts: [{ type: String }],                             // 提取的关键事实/偏好
        updatedAt: { type: Date, default: Date.now }
    },
    { collection: 'LongTermMemory' }
);

module.exports = mongoose.model('LongTermMemory', LongTermMemorySchema);