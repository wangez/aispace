// 意图分类
const { dsChat } = require('../../config/LLMs');

async function callLLMForIntent(query, messages, supplement) {
    const text = messages.map(item => `${item.role === 'user' ? '用户：' : 'ai：'}${item.content}`)

    let historyText = supplement
        ? `历史对话如下
${text.join(`
`)}`
        : ''
    // 这里用一段精心设计的提示词，一次性完成“意图分类”和“参数提取”
    const prompt = `
你是一个电力服务意图识别专家。请根据用户的输入，分析其意图并提取关键信息。如果有历史输入，按需结合历史输入分析。意图包括：
- predict_with_trend（基于趋势的预测）
- predict_with_trend_chart（基于趋势的预测，并通过图表展示）
- simple_predict（简单预测，不强调依据）
- data_display_chart（查询并展示数据，并通过图表展示）
- supplement（补充、完善、澄清、纠正、追问）
- other（其他）

用户问题：${query}
${historyText}
请以JSON格式返回结果，包含以下字段：
- intent: 意图类型
- supplemented: 当意图类型为supplement时，补充完善的意图类型
- reasoning: 简要说明你的判断理由（非常重要，用于验证）
    `;
    const response = await dsChat.invoke([
        ...messages,
        { role: 'user', content: prompt }
    ]);
    // 解析大模型返回的JSON结果
    let result
    try {
        result = JSON.parse(response.content);
    } catch (e) {
        let content = response.content.replace('```json', '').replace('```', '')
        result = JSON.parse(content);
    }
    if (supplement) {
        console.log('判断为supplement后加载历史对话再次判断', result)
    } else if (result.intent === 'supplement' && messages.length) {
        return await callLLMForIntent(query, messages, true)
    }

    return { ...result, source: 'llm_routing' };
}

module.exports = callLLMForIntent