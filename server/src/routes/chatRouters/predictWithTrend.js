const mongoose = require("mongoose");
const { z } = require("zod");
const { createAgent, tool, createMiddleware } = require("langchain")
const agentMessage = require("../../tools/agentMessage")
const { dsReasonerZero } = require('../../config/LLMs')
const writeSSE = require('../../tools/writeSSE')

const usageSchema = new mongoose.Schema({
    user_id: { type: String, ref: 'User' },
    year_month: String,
    usage: Number
}, { collection: 'bus_usage' });
const Usage = mongoose.model("Usage", usageSchema);

const userSchema = new mongoose.Schema({
    _id: String,
    area_id: { type: String, ref: 'Area' },
    manager_id: String,
    name: String,
    address: String
}, { collection: 'bus_user' });
const User = mongoose.model("User", userSchema);

const areaSchema = new mongoose.Schema({
    _id: String,
    name: String,
    address: String,
    manager_id: String
}, { collection: 'bus_area' });
const Area = mongoose.model("Area", areaSchema);

/**
 * 工具1: 根据单个历史周期数据的变化趋势，预测当前周期尚未发生的后续数据。
 * 预测策略：计算历史周期中相邻点的平均增量，然后基于当前周期的最后一个数据点依次累加预测后续各点。
 * 如果历史周期与当前周期长度不同，自动按比例缩放增量。
 */
const forecastByTrendTool = tool(
    async ({
        historicalData,
        currentData,
        totalPointsPerPeriod,
    }) => {
        console.log('forecastByTrendTool: ', historicalData, currentData, totalPointsPerPeriod)
        // ----- 1. 参数校验与预处理 -----
        if (!Array.isArray(historicalData) || historicalData.length < 2) {
            return "错误：历史周期数据至少需要2个数据点才能计算趋势。";
        }
        if (!Array.isArray(currentData) || currentData.length === 0) {
            return "错误：当前周期至少需要1个已观测数据点。";
        }

        // 确定每个周期的总点数
        const totalPoints = totalPointsPerPeriod ?? historicalData.length; // 默认与历史周期长度一致
        if (totalPoints <= currentData.length) {
            return `错误：当前周期数据长度(${currentData.length})已经达到或超过总点数(${totalPoints})，无需预测。`;
        }

        const remainingPoints = totalPoints - currentData.length;

        // ----- 2. 计算历史周期中的趋势（平均增量）-----
        const increments = [];
        for (let i = 1; i < historicalData.length; i++) {
            increments.push(historicalData[i] - historicalData[i - 1]);
        }
        const avgIncrement = increments.reduce((a, b) => a + b, 0) / increments.length;

        // 如果历史周期长度与目标总点数不同，需要缩放平均增量
        // 假设历史周期长度 = H，目标总点数 = T，则预测时每一步的增量应乘以 (T-1)/(H-1)
        const scale = totalPoints === historicalData.length ? 1 : (totalPoints - 1) / (historicalData.length - 1);
        const adjustedIncrement = avgIncrement * scale;

        // ----- 3. 生成预测值 -----
        const predictions = [];
        let lastValue = currentData[currentData.length - 1];
        for (let i = 0; i < remainingPoints; i++) {
            const nextValue = lastValue + adjustedIncrement;
            predictions.push(nextValue);
            lastValue = nextValue;
        }

        // ----- 4. 返回结果（格式化为易读字符串）-----
        return `预测结果：当前周期的后续 ${remainingPoints} 个数据点为 [${predictions.map(v => v.toFixed(2)).join(", ")}]。`;
    },
    {
        name: "forecast_by_historical_trend",
        shotDes: '根据一个完整历史周期（例如上周、上个月）的数据趋势，预测当前周期尚未发生的后续数据点。',
        description: `根据一个完整历史周期（例如上周、上个月）的数据趋势，预测当前周期尚未发生的后续数据点。
使用场景：你拥有一个已完成的历史周期（每个时间点的数值已知），以及当前周期已经发生的前几个数据点。此工具会计算历史周期中相邻点的平均变化量，然后应用于当前周期已有的最后一个值，逐点向前预测剩余数据。

参数说明：
- historicalData: 一维数组，代表一个完整历史周期的所有数据点（按时间顺序）。例如 [50, 53, 56] 表示历史周期有3个点，依次递增。
- currentData: 一维数组，代表当前周期已经观测到的数据点（按时间顺序）。例如 [57, 60] 表示当前周期前两个点的数值。
- totalPointsPerPeriod: 可选，每个周期固定的总数据点数。若不提供，默认与 historicalData 长度相同。若当前周期总点数与历史周期不同，请务必传入此参数。

输出：预测的剩余数据点数组（保留两位小数）。`,
        schema: z.object({
            historicalData: z.array(z.number()).describe("一个完整历史周期的数值序列，长度至少为2。"),
            currentData: z.array(z.number()).describe("当前周期已观测到的数值序列，长度至少为1且小于总周期点数。"),
            totalPointsPerPeriod: z.number().int().positive().optional().describe("每个周期的固定总点数，例如 10。若不提供，则默认等于 historicalData 的长度。"),
        }),
    }
);

// 工具2: 获取台区或用户某一年的用电量
const get12MounthUsage = tool(
    async ({ type, year, name }) => {
        console.log('get12MounthUsage: ', type, year, name)
        let result = []   // 城西台区A
        if (type === '台区') {
            const find = await Area.find({ name })
            console.log(find)
            if (find && find.length) {
                console.log('台区id', find[0]._id)
                result = await Usage.aggregate([
                    {
                        $lookup: {
                            from: User.collection.name,          // 实际集合名称，通常是模型名的小写复数
                            localField: 'user_id',
                            foreignField: '_id',
                            as: 'user'
                        }
                    },
                    { $unwind: '$user' },
                    {
                        $match: {
                            'user.area_id': find[0]._id,
                            year_month: { $gte: year + '-01', $lte: year + '-12' }
                        }
                    },
                    {
                        $group: {
                            _id: '$year_month',
                            total_usage: { $sum: '$usage' }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]);
                console.log(result)
            } else {
                return `没有找到名为${name}的台区数据`
            }
        } else {
            const find = await User.find({ name })
            if (find.length > 1) {
                // 有重名用户
            } else if (find.length) {
                result = await Usage.find({
                    user_id: find[0]._id,
                    year_month: { $gte: '2025-01', $lte: '2025-12' }
                })
                    .sort({ year_month: 1 })  // 按月份升序
                    .select('year_month usage -_id'); // 只返回需要的字段
            } else {
                return `没有找到用户名为${name}的数据`
            }
        }

        return result.length > 0
            ? JSON.stringify(result)
            : `${type}${name}在${year}年无用电量记录。`;
    },
    {
        name: "get_product_sales",
        description: "获取台区或用户某年12个月每个月的用电量, 不满12个月有多少返回多少",
        schema: z.object({
            type: z.string().describe("查询目标是台区还是用户，例如 台区"),
            year: z.number().describe("年份，例如 2025"),
            name: z.string().describe("台区名称或者用户名称，例如 城西街道5号"),
        }),
    },
);

const enter = `
`
const createSystemPrompt = list => `你是一个数据分析助手，负责回答业务问题。
你可以使用以下工具：
${list.map(item => `- ${item.name}: ${item.shotDes || item.description}`).join(enter)}
请严格遵循ReAct模式：思考(Thought) -> 行动(Action) -> 观察(Observation) -> 重复，直到能给出最终答案。
最终答案必须基于工具返回的数据。
如果遇到错误或数据不足，请如实告知用户。`

async function runAgent(res, userQuestion, saveMsg) {
    console.log(`🙋 用户提问: ${userQuestion}`);

    try {
        let timeFleg = Date.now()
        const tools = [forecastByTrendTool, get12MounthUsage]
        const systemPrompt = createSystemPrompt(tools)
        const middleware = []
        if (saveMsg) {
            middleware.push(createMiddleware({
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
            }))
        }
        const agent = createAgent({
            model: dsReasonerZero,
            tools,
            systemPrompt,
            middleware
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
                    // writeSSE(res, 'delta', { content: reasoning })
                    // process.stdout.write(reasoning);
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
                    writeSSE(res, 'delta', { content: reasoning })
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

module.exports = runAgent