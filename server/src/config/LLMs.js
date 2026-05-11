const { ChatDeepSeek } = require('@langchain/deepseek');
const { ChatOpenAI } = require("@langchain/openai")

const dsChat = new ChatDeepSeek({ model: 'deepseek-chat', temperature: 0 });
const dsReasoner = new ChatDeepSeek({ model: 'deepseek-reasoner', temperature: 0.7 })
const dsReasonerZero = new ChatDeepSeek({ model: 'deepseek-reasoner', temperature: 0 })

module.exports = {
    dsChat,
    dsReasoner,
    dsReasonerZero
}