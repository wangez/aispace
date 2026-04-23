const express = require('express')
const { createOpenAI } = require('@ai-sdk/openai');
const { streamText } = require('ai');

const { queryTopProducts, getProductSales } = require('../tools/sale');

const router = express.Router()
const deepseek = createOpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
});
const model = deepseek('deepseek-reasoner');

function runAgentStream(userQuestion) {
    console.log(`🙋 用户提问: ${userQuestion}`);

    const messages = [
        {
            role: 'system',
            content: `你是一个数据分析助手，负责回答业务问题。
      
      你可以使用以下工具：
      - queryTopProducts: 查询指定区域、指定月份内销售额最高的产品。
      - getProductSales: 查询特定产品在指定月份的销售额。
      
      请严格遵循ReAct模式：思考(Thought) -> 行动(Action) -> 观察(Observation) -> 重复，直到能给出最终答案。
      最终答案必须基于工具返回的数据。
      如果遇到错误或数据不足，请如实告知用户。`
        },
        { role: 'user', content: userQuestion }
    ];

    return streamText({
        model,
        messages,
        tools: {
            queryTopProducts,
            getProductSales,
        },
        maxSteps: 10,          // 最大工具调用轮数
        temperature: 0.1,      // 可调整，保持输出稳定
    });
}

function setHeader(res) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
}

router.post('/', async (req, res) => {
    setHeader(res)
    const { messages } = req.body
    const parts = messages[messages.length - 1].parts
    const question = parts[parts.length - 1].text

    try {
        const streamResult = runAgentStream(question);
        return streamResult.pipeDataStreamToResponse(res);
    } catch (error) {
        res.status(500).json({ error: '处理请求时发生错误' });
    }
});

module.exports = router