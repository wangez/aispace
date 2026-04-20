// 意图分类
const { ChatDeepSeek } = require('@langchain/deepseek');

const classifierLLM = new ChatDeepSeek({ model: 'deepseek-chat', temperature: 0 });

async function isProgrammingRelated(userMessage) {
    const prompt = `判断以下用户问题是否与编程、软件开发、算法、技术学习、代码调试、计算机科学相关。只回答 "是" 或 "否"。\n问题：${userMessage}`;
    const response = await classifierLLM.invoke([{ role: 'user', content: prompt }]);
    return response.content.trim() === '是' ? 'coder' : 'chat';
}

module.exports = { isProgrammingRelated };