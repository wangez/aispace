// 引用依赖
const express = require('express')
const { createAgent, tool } = require("langchain")
const { ChatOpenAI } = require("@langchain/openai")
const z = require("zod")
const { queryTopProducts, getProductSales } = require('../tools/sale');
const agentMessage = require("../tools/agentMessage")

const { createMiddleware } = require("langchain")

const model = new ChatOpenAI({
    model: "deepseek-reasoner",                     // DeepSeek 模型名称
    temperature: 0,
    apiKey: process.env.DEEPSEEK_API_KEY,       // 从环境变量读取 API Key
    configuration: {
        baseURL: "https://api.deepseek.com/v1",   // DeepSeek API 地址
    },
});

const router = express.Router()
const enter = `
`
const createSystemPrompt = list => `你是一个数据分析助手，负责回答业务问题。
你可以使用以下工具：
${list.map(item => `- ${item.name}: ${item.description}`).join(enter)}
请严格遵循ReAct模式：思考(Thought) -> 行动(Action) -> 观察(Observation) -> 重复，直到能给出最终答案。
最终答案必须基于工具返回的数据。
如果遇到错误或数据不足，请如实告知用户。`

async function runAgent(res, userQuestion) {
    console.log(`🙋 用户提问: ${userQuestion}`);

    try {
        let timeFleg = Date.now()
        const tools = [queryTopProducts, getProductSales]
        const systemPrompt = createSystemPrompt(tools)
        const agent = createAgent({
            model,
            tools,
            systemPrompt,
            middleware: [
                createMiddleware({
                    name: "afterAgent",
                    afterAgent: (state) => {
                        let message = [
                            {
                                id: [null, null, 'SystemPrompt'],
                                kwargs: {
                                    content: systemPrompt
                                }
                            },
                            ...state.messages
                        ]
                        agentMessage({
                            messageList: JSON.stringify(message, null, 2),
                            timeFleg
                        })
                        return;
                    }
                }),
                // createMiddleware({
                //     name: "RetryMiddleware",
                //     wrapModelCall: (request, handler) => {
                //         debugger
                //         return handler(request);
                //     },
                // })
            ]
        });
        const stream = await agent.stream(
            { messages: [{ role: "user", content: userQuestion }] },
            { streamMode: "messages" }
        );

        for await (const chunk of stream) {
            try {
                // chunk 是 [AIMessageChunk] 格式
                const messageChunk = chunk[0];

                // 跳过工具调用相关信息（如果你也想展示工具调用，可单独处理）
                if (messageChunk.tool_call_id || messageChunk.usage_metadata) {
                    continue;
                }

                // 1. 处理推理内容（思考过程）
                const reasoning = messageChunk.additional_kwargs?.reasoning_content;
                if (reasoning) {
                    // 发送思考过程事件
                    // res.write(`event: thought\n`);
                    // res.write(`data: ${JSON.stringify({ content: reasoning })}\n\n`);
                    process.stdout.write(reasoning);
                }

                // 2. 处理正式回答内容（支持 contentBlocks 或 content）
                let textContent = '';
                if (messageChunk.contentBlocks) {
                    const textBlocks = messageChunk.contentBlocks.filter(b => b.type === 'text');
                    textContent = textBlocks.map(b => b.text).join('');
                } else if (typeof messageChunk.content === 'string') {
                    textContent = messageChunk.content;
                }

                if (textContent) {
                    process.stdout.write(textContent);
                    // res.write(`event: answer\n`);
                    // res.write(`data: ${JSON.stringify({ content: textContent })}\n\n`);
                }
            } catch (e) {
                console.log(e)
            }
        }

        // 发送完成事件
        res.write(`event: done\n`);
        res.write(`data: [DONE]\n\n`);
    } catch (error) {
        console.error("Agent运行出错:", error);
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ error: "处理您的问题时遇到内部错误" })}\n\n`);
    }
}

function setHeader(res) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
}

router.post('/', async (req, res) => {
    setHeader(res)
    try {
        await runAgent(res, '帮我看看2026年3月华东区卖得最好的产品是啥，跟2026年4月比涨了还是跌了？');
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

