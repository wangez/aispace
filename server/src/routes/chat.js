// 引用依赖
const express = require('express')
const predictWithTrend = require('./chatRouters/predictWithTrend')
const advancedIntentRecognition = require('./chatRouters/advancedIntentRecognition')
const { saveChat } = require('../models/SysChat')


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
    if (!historyId) {
        let history = new History({ label: content, userId })
        await history.save()
        historyId = history._id
    }
    const order = await getNextSequenceValue(historyId)
    return { content, historyId, order, userId }
}

// SSE 写入辅助函数
function writeSSE(res, event, data) {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
}

router.post('/', async (req, res) => {
    setHeader(res)
    const { content, historyId, order, userId } = await initialize(req)
    const aiChat = await saveChat(content, historyId, order)
    // 发送元数据
    writeSSE(res, 'meta', { history, chatId: aiChat._id })
    try {
        const result = await advancedIntentRecognition(req.body.content)

        console.log(result.intent)
        if (result.intent === 'predict_with_trend') {
            predictWithTrend(res, req.body.content)
        }
        // await runAgent(res, '帮我看看2026年3月华东区卖得最好的产品是啥，跟2026年4月比涨了还是跌了？');
        // 发送结束标记
        res.write(`data: [DONE]\n\n`);
        res.end();
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

module.exports = router

