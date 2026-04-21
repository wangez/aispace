const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            required: true,
        },
        content: {
            type: String,
        },
        order: {
            type: Number,
            required: true,
        },
        status: {   // pending / streaming / completed / failed
            type: String,
            required: true,
        },
        historyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'History',
            required: true,
        },
    },
    { collection: 'chat' }
);

const Chat = mongoose.model('chat', chatSchema);

async function saveChat(content, historyId, order) {
    // 存储用户消息
    const userChat = new Chat({
        role: 'user',
        content,
        historyId,
        order,
        status: 'completed'
    })
    await userChat.save()

    // 创建待填充的 AI 消息
    const aiChat = new Chat({
        role: 'assistant',
        content: '',
        historyId,
        order: order + 1,
        status: 'pending'
    })
    await aiChat.save()
    return aiChat
}

async function getChatByHistory(historyId) {
    return await Chat.find({ historyId }).sort({ order: 1 });
}

module.exports = {
    getChatByHistory,
    saveChat,
    Chat
}