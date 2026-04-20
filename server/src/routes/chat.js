// 引用依赖
const express = require('express')
const { ChatDeepSeek } = require('@langchain/deepseek')
// 引用文件
const { getChatByHistory, saveChat } = require('../models/Chat')
const { Role, QuestionTemp } = require('../models/QuestionTemp')
const Counter = require('../models/Counter')
const History = require('../models/History')
const { updateLongTermMemory, getLongTermMemoryText } = require('../utils/memoryManager')
const { isProgrammingRelated } = require('../utils/intentClassifier')
const { upsertVector, querySimilarCollections } = require('../services/vectorStore')
const { upsertQTVector, queryQTSimilarCollections } = require('../services/typeIdentification')
const { executeQuery } = require('../models/bus/executeQuery')

const router = express.Router()
// 模型配置
const llm = new ChatDeepSeek({
    model: 'deepseek-reasoner',
    temperature: 0.7
})
const llmInvoke = new ChatDeepSeek({
    model: 'deepseek-chat',
    temperature: 0
})

// 原子自增计数器
async function getNextSequenceValue(sequenceId) {
    const counter = await Counter.findOneAndUpdate(
        { _id: sequenceId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq
}

// SSE 写入辅助函数
function writeSSE(res, event, data) {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
}

function setHeader(res) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
}

async function initialize(req) {
    const { content, type } = req.body
    let { historyId } = req.body
    const userId = req.user?.id || 'anonymous'
    let history = historyId ? await History.findById(historyId) : null
    if (!history) {
        history = new History({ label: content, userId })
        await history.save()
        historyId = history._id
    }
    const order = await getNextSequenceValue(historyId)
    return { history, content, historyId, type, order, userId }
}

async function loadHistoryChat(messages, historyId) {
    // 加载本次会话的历史消息（短期记忆）
    const oldChats = await getChatByHistory(historyId)
    oldChats.forEach(item => {
        messages.push({ role: item.role, content: item.content })
    })
}
// 构建普通聊天对话
async function createChatMessage(req, content, userId, historyId, roleInfo) {
    // 加载对应用户对应角色长期记忆
    let longTermMemoryText = await getLongTermMemoryText(userId, roleInfo.code);
    // 构建系统提示
    let systemPrompt = `你是一个${roleInfo.role}。你的回答风格是${roleInfo.style}。
以下是关于该用户的长期记忆信息：
${longTermMemoryText}
请记住用户之前说的内容。`
    const messages = [{ role: 'system', content: systemPrompt }]
    await loadHistoryChat(messages, historyId)
    messages.push({ role: 'user', content })

    return messages
}
// 构建业务数据查询对话
async function creatBusMessage(req, content, addToTemp, historyId) {
    await upsertVector() // 确保向量库已初始化
    const match = await querySimilarCollections(content) // 向量查询应该查询哪个集合
    if (match.length) {
        const queryMsg = [{ role: 'system', content: '你是一个 MongoDB 查询专家，只输出可执行的 JavaScript 代码。 ' }]
        await loadHistoryChat(queryMsg, historyId)
        // 找到对应的集合
        const queryGenPrompt = `
根据用户问题生成可执行的 JavaScript 代码（async 函数体），入参名称model使用传入的 Mongoose model 返回查询结果。
要求：只读操作（find/aggregate/countDocuments），不修改数据，代码用 return 返回结果，只输出代码无解释。
用户问题：${content}
可用集合 Schema：${match[0].doc}`
        queryMsg.push({ role: 'user', content: queryGenPrompt })

        const response = await llmInvoke.invoke(queryMsg) // 调用 LLM 生成查询语句
        const cleanCode = response.content.replace(/```javascript|```/g, '').trim()
        console.log('query code: ', cleanCode)
        const query = await executeQuery(match[0].collectionName, cleanCode) // 执行查询语句
        const messages = [{ role: 'system', content: '你是一个数据分析专家，处理数据后输出markdown格式报告。' }]
        messages.push({
            role: 'user',
            content: `用户问题：${content}
查询结果：${JSON.stringify(query, null, 2)}
请根据查询结果用自然语言回答用户问题。要求清晰、简洁，以适当格式突出关键数据。`
        });
        return messages
    } else {
        // 没有找到对应的集合，返回一个默认的fallback消息，避免后续出错
        console.warn('No matching collection found for content:', content);
        const messages = [{ role: 'system', content: '你是一个数据分析专家，处理数据后输出markdown格式报告。' }];
        messages.push({
            role: 'user',
            content: `用户问题：${content}\n查询结果：未找到相关数据集合。请礼貌告知用户暂时无法处理该查询。`
        });
        return messages;
    }
}
// 流式调用 LLM
async function dollmStream(res, messages) {
    const stream = await llm.stream(messages)
    let fullContent = ''
    for await (const chunk of stream) {
        const delta = chunk.content
        if (delta) {
            fullContent += delta
            writeSSE(res, 'delta', { content: delta })
        }
    }
    return fullContent
}
// 创建对话（SSE 流式）
router.post('/', async (req, res) => {
    try {
        // SSE 响应头
        setHeader(res)
        let type = req.body.type
        const { content, addToTemp } = req.body
        const { history, historyId, order, userId } = await initialize(req)

        let roleInfo
        if (!type) {
            // 用户没有选择 聊天 还是 查询统计业务数据  
            await upsertQTVector()
            let match = await queryQTSimilarCollections(content)
            type = match.role
        }
        if (type === 'chat') {
            // 快速意图分类  区分 通用聊天  和  编程
            console.log('快速意图分类')
            type = await isProgrammingRelated(content);
        }
        roleInfo = (await Role.find({ code: type }))[0]


        let messages
        if (roleInfo.code === 'bus') {
            // 业务数据查询
            console.log('业务数据查询')
            messages = await creatBusMessage(req, content, addToTemp, historyId);
        } else {
            // 兜底模式：当作普通聊天处理
            messages = await createChatMessage(req, content, userId, historyId, roleInfo);
        }
        if (addToTemp) {
            // 选择记录问题 且能查询到对应的集合
            const qt = new QuestionTemp({
                text: content,
                role: roleInfo.code,
                source: 'user'
            })
            await qt.save()
        }
        const aiChat = await saveChat(content, historyId, order)
        // 发送元数据
        writeSSE(res, 'meta', { history, chatId: aiChat._id })
        // 流式调用 LLM
        const fullContent = await dollmStream(res, messages)
        // 更新并结束流
        aiChat.status = 'completed'
        aiChat.content = fullContent
        await aiChat.save()

        // ========== 异步更新长期记忆（不阻塞响应） ==========
        // 获取完整的本次会话消息（包括刚刚产生的 AI 回复）
        const allMessages = await getChatByHistory(historyId)
        const messageList = allMessages.map(m => ({ role: m.role, content: m.content }))
        // 异步更新，不阻塞
        updateLongTermMemory(userId, roleInfo.code, messageList).catch(err => console.error('记忆更新失败:', err))

        writeSSE(res, 'done', { status: 'success' })
        res.end()
    } catch (error) {
        console.error('Stream error:', error)
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: error.message })
        } else {
            writeSSE(res, 'error', { message: error.message })
            res.end()
        }
    }
})

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