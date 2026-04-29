// 引用依赖
const express = require('express')
const predictWithTrend = require('./chatRouters/predictWithTrend')
const queryData = require('./chatRouters/queryData')
const advancedIntentRecognition = require('./chatRouters/advancedIntentRecognition')
const { getChatByHistory, saveChat } = require('../models/SysChat')
const History = require('../models/SysHistory')
const Counter = require('../models/SysCounter')
const writeSSE = require('../tools/writeSSE')

const router = express.Router()

function setHeader(res) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
}

// 原子自增计数器
async function getNextSequenceValue(historyId) {
    const counter = await Counter.findOneAndUpdate(
        { _id: historyId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq
}

async function initialize(req) {
    const { content } = req.body
    let historyId = req.body.historyId
    const userId = req.user.id
    let messages = []
    if (historyId) {
        const historyList = await getChatByHistory(historyId)
        messages = historyList.map(item => {
            return { role: item.role, content: item.content }
        })
    } else {
        let history = new History({ label: content, userId })
        await history.save()
        historyId = history._id
    }
    const order = await getNextSequenceValue(historyId)
    return { content, historyId, order, userId, messages }
}

router.post('/', async (req, res) => {
    setHeader(res)
    const { content, historyId, order, userId, messages } = await initialize(req)
    const aiChat = await saveChat(content, historyId, order)
    // 发送元数据
    writeSSE(res, 'meta', { historyId, chatId: aiChat._id })
    try {
        const result = await advancedIntentRecognition(req.body.content, messages)

        let fullContent = ''
        let fullReasoning = ''
        let intent = result.intent
        if (intent === 'supplement') {
            intent = result.supplemented
        }
        if (intent === 'predict_with_trend') {
            let full = await predictWithTrend(res, req.body.content, messages)
            fullContent = full.fullContent
            fullReasoning = full.fullReasoning
        } else if (intent === 'data_display') {
            let full = await queryData(res, req.body.content, messages)
            fullContent = full.fullContent
            fullReasoning = full.fullReasoning
        }
        aiChat.status = 'completed'
        aiChat.content = fullContent
        aiChat.reasoning = fullReasoning
        await aiChat.save()
        // 发送结束标记
        writeSSE(res, 'done', { status: 'success' })
    } catch (error) {
        console.error('API处理出错:', error);
        // 若流尚未开始，返回常规 JSON 错误
        if (!res.headersSent) {
            res.status(500).json({ error: '处理请求时发生错误' });
        } else {
            res.write(`data: ${JSON.stringify({ error: '内部错误' })}\n\n`);
            res.end();
        }
    }
});

// 获取指定会话的对话记录
router.get('/:historyId', async (req, res) => {
    try {
        const chats = await getChatByHistory(req.params.historyId)
        res.json({ success: true, data: chats })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message })
    }
});

module.exports = router

