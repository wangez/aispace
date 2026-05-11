const { createAgent } = require("langchain")
const agentMiddleware = require('./agentMiddleware.js')
const writeSSE = require('../../tools/writeSSE.js')
const { dsReasonerZero } = require('../../config/LLMs.js')

const enter = `
`
const createSystemPrompt = list => `你是一个数据分析助手，负责回答业务问题。全程使用中文思考和交流。
你可以使用以下工具：
${list.map(item => `- ${item.name}: ${item.shotDes || item.description}`).join(enter)}
请严格遵循ReAct模式：思考(Thought) -> 行动(Action) -> 观察(Observation) -> 重复，直到能给出最终答案。
最终答案必须基于工具返回的数据。
当需要图表展示时，返回给用户echarts图表配置。
如果遇到错误或数据不足，请如实告知用户。`

function createRunAgent(tools) {
    return async function (res, userQuestion, messages) {
        console.log(`🙋 用户提问: ${userQuestion}`);

        try {
            const systemPrompt = createSystemPrompt(tools)

            const agent = createAgent({
                model: dsReasonerZero,
                tools,
                systemPrompt,
                middleware: agentMiddleware(systemPrompt)
            });
            const stream = await agent.stream(
                {
                    messages: [
                        ...messages,
                        { role: "user", content: userQuestion }
                    ]
                },
                { streamMode: "messages" }
            );
            let fullContent = ''
            let fullReasoning = ''
            for await (const chunk of stream) {
                try {
                    // chunk 是 [AIMessageChunk] 格式
                    const messageChunk = chunk[0];
                    if (!messageChunk) {
                        console.log(chunk)
                        continue
                    }

                    // 跳过工具调用相关信息（如果你也想展示工具调用，可单独处理）
                    if (messageChunk.tool_call_id) {
                        fullReasoning += '<\br>'
                        writeSSE(res, 'delta', { reasoning: '<\br>' })
                        continue;
                    }
                    if (messageChunk.usage_metadata) {
                        continue;
                    }

                    // 1. 处理推理内容（思考过程）
                    const reasoning = messageChunk.additional_kwargs?.reasoning_content;
                    if (reasoning) {
                        fullReasoning += reasoning
                        writeSSE(res, 'delta', { reasoning })
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
                        fullContent += textContent
                        writeSSE(res, 'delta', { content: textContent })
                    }
                } catch (e) {
                    console.error(e)
                }
            }
            return {
                fullReasoning,
                fullContent
            }
        } catch (error) {
            console.error("Agent运行出错:", error);
            res.write(`event: error\n`);
            res.write(`data: ${JSON.stringify({ error: "处理您的问题时遇到内部错误" })}\n\n`);
        }
    }
}

module.exports = createRunAgent