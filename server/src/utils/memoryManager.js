// 长期记忆
const LongTermMemory = require('../models/LongTermMemory');
const { ChatDeepSeek } = require('@langchain/deepseek');
const { PromptTemplate } = require('@langchain/core/prompts');

// 使用同一个模型实例（温度可以调低一点，让总结更稳定）
const summaryLLM = new ChatDeepSeek({
    model: 'deepseek-reasoner',
    temperature: 0.3
});
// 从一段对话历史中提取摘要和关键事实
async function extractSummaryAndFacts(messages) {
    const conversationText = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

    const summaryPrompt = PromptTemplate.fromTemplate(`
你是一个信息提炼助手。请根据以下对话，完成两项任务：
1. 用一段中文总结对话核心内容（不超过150字）。
2. 列出对话中出现的**用户偏好、实体事实、重要信息**（每条一行，用“- ”开头）。

对话内容：
{conversation}

请按以下格式输出：
【摘要】
（此处填写摘要）

【关键事实】
- 事实1
- 事实2
`);

    const chain = summaryPrompt.pipe(summaryLLM);
    const response = await chain.invoke({ conversation: conversationText });
    const output = response.content;

    // 简单解析
    const summaryMatch = output.match(/【摘要】\s*([\s\S]*?)\s*【关键事实】/);
    const factsMatch = output.match(/【关键事实】\s*([\s\S]*)/);

    const summary = summaryMatch ? summaryMatch[1].trim() : '';
    const factsText = factsMatch ? factsMatch[1].trim() : '';
    const facts = factsText
        .split('\n')
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(f => f.length > 0);

    return { summary, facts };
}
// 更新或创建用户的长期记忆
async function updateLongTermMemory(userId, role, messages) {
    const { summary, facts } = await extractSummaryAndFacts(messages);

    await LongTermMemory.findOneAndUpdate(
        { userId, role },
        { summary, facts, updatedAt: new Date() },
        { upsert: true, new: true }
    );
}
// 获取用户的长期记忆文本（可直接拼接进系统提示）
async function getLongTermMemoryText(userId, role) {
    const memory = await LongTermMemory.findOne({ userId, role });
    if (!memory) return '';

    let text = '';
    if (memory.summary) {
        text += `【历史对话摘要】\n${memory.summary}\n\n`;
    }
    if (memory.facts && memory.facts.length > 0) {
        text += `【已知的用户信息】\n${memory.facts.map(f => `- ${f}`).join('\n')}\n`;
    }
    return text;
}

module.exports = {
    updateLongTermMemory,
    getLongTermMemoryText
};