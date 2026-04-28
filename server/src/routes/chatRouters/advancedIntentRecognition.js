// 意图分类
const { dsChat } = require('../../config/LLMs');

const KEYWORDS_RULES = [
    { intent: 'data_display', keywords: ['查询', '展示', '显示', '看看'], target: ['趋势', '数据', '历史'] },
    { intent: 'simple_predict', keywords: ['预测', '预估'], exclude: ['往年', '过去', '趋势'] },
    { intent: 'analyze_predict', keywords: ['预测', '预估'], include: ['往年', '趋势', '根据'] }
];

function applyRuleEngine(query) {
    // 这是对上一轮方案的优化：把关键词匹配作为第一层“快速筛选”
    for (const rule of KEYWORDS_RULES) {
        let match = true;
        for (const keyword of rule.keywords) {
            if (!query.includes(keyword)) match = false;
        }
        // 可以根据需要增加 include/exclude 判断
        if (rule.include) {
            for (const inc of rule.include) {
                if (!query.includes(inc)) match = false;
            }
        }
        if (rule.exclude) {
            for (const exc of rule.exclude) {
                if (query.includes(exc)) match = false;
            }
        }
        if (match) {
            return { intent: rule.intent, source: 'rule_engine', confidence: 0.99 };
        }
    }
    return null;
}

async function callLLMForIntent(query) {
    // 这里用一段精心设计的提示词，一次性完成“意图分类”和“参数提取”
    const prompt = `
你是一个电力服务意图识别专家。请根据用户的输入，分析其意图并提取关键信息。意图包括：
- predict_with_trend（基于趋势的预测）
- simple_predict（简单预测，不强调依据）
- data_display（查询并展示数据）
- other（其他）

用户问题：${query}

请以JSON格式返回结果，包含以下字段：
- intent: 意图类型
- reasoning: 简要说明你的判断理由（非常重要，用于验证）
    `;

    const response = await dsChat.invoke([{ role: 'user', content: prompt }]);
    console.log(response.content)
    // 解析大模型返回的JSON结果
    const result = JSON.parse(response.content);
    console.log('LLM识别结果及理由:', result.reasoning);
    return { ...result, source: 'llm_routing' };
}

async function advancedIntentRecognition(userQuery) {
    // 第一步：先走规则引擎，处理那些能用“关键词”明确区分的请求
    const ruleResult = applyRuleEngine(userQuery);
    if (ruleResult) {
        console.log('命中规则引擎:', ruleResult);
        return ruleResult;
    }

    // 第二步：如果规则匹配不了，再调用大模型 API 作为“智慧兜底”
    console.log('复杂语义，交给LLM兜底处理...');
    const llmResult = await callLLMForIntent(userQuery);
    return llmResult;
}

module.exports = advancedIntentRecognition