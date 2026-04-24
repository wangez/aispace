const express = require('express')
const StreamChunk = require('../models/Stream.js')

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const data = await StreamChunk.distinct('timeFleg');
        res.json({ data })
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

router.get('/:timeFleg', async (req, res) => {
    try {
        console.log(req.params.timeFleg)
        const { timeFleg } = req.params
        const data = await StreamChunk.find({ timeFleg });
        res.json({ data })
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