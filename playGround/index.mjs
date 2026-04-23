import { createAgent, tool } from "langchain"
import mongoose from "mongoose"
import { ChatOpenAI } from "@langchain/openai"
import * as z from "zod"
import { config } from 'dotenv'
config()


async function c() {
    await mongoose.connect(process.env.MONGODB_URI + '/bus_db')
}

const salesSchema = new mongoose.Schema({
    productId: String,
    productName: String,
    amount: Number,
    region: String,
    saleDate: Date,
}, { collection: 'sale' });

const Sales = mongoose.model("Sales", salesSchema);

const queryTopProducts = tool(
    async ({ region, year, month, limit }) => {
        console.log(
            `📊 [Tool] 查询${year}年${month}月 ${region} 销售额TOP${limit}产品`,
        );
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const results = await Sales.aggregate([
            {
                $match: {
                    region: region,
                    saleDate: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: "$productId",
                    name: { $first: "$productName" },
                    totalAmount: { $sum: "$amount" },
                },
            },
            { $sort: { totalAmount: -1 } },
            { $limit: limit },
        ]);

        console.log('queryTopProducts', results)
        return results.length > 0
            ? JSON.stringify(results)
            : `在${year}年${month}月的${region}未找到销售数据。`;
    },
    {
        name: "query_top_products",
        description:
            "查询指定区域和月份内，销售额最高的前N个产品。用于获取某个区域的销售排行。",
        schema: z.object({
            region: z.string().describe("要查询的区域，例如 '华东区'"),
            year: z.number().describe("年份，例如 2025"),
            month: z.number().describe("月份，例如 5"),
            limit: z.number().default(3).describe("返回的产品数量，默认为3"),
        }),
    },
);

const getProductSales = tool(
    async ({ productId, year, month }) => {
        console.log(`📊 [Tool] 查询产品${productId}在${year}年${month}月的销售额`);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const results = await Sales.aggregate([
            {
                $match: {
                    productId: productId,
                    saleDate: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: "$productId",
                    name: { $first: "$productName" },
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]);

        console.log('getProductSales', results)
        return results.length > 0
            ? JSON.stringify(results[0])
            : `产品${productId}在${year}年${month}月无销售记录。`;
    },
    {
        name: "get_product_sales",
        description:
            "获取特定产品在指定时间段（某个月）的总销售额。用于对比产品在不同月份的销售情况。",
        schema: z.object({
            productId: z.string().describe("产品的唯一标识符"),
            year: z.number().describe("年份，例如 2025"),
            month: z.number().describe("月份，例如 6"),
        }),
    },
);

const model = new ChatOpenAI({
    model: "deepseek-chat",
    temperature: 0,
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
        baseURL: "https://api.deepseek.com/v1",
    },
});

const agent = createAgent(
    {
        model,
        tools: [queryTopProducts, getProductSales],
        systemPrompt: `你是一个数据分析助手，负责回答业务问题。
你可以使用以下工具：
- query_top_products: 查询指定区域、指定月份内销售额最高的产品。
- get_product_sales: 查询特定产品在指定月份的销售额。

请严格遵循ReAct模式：思考(Thought) -> 行动(Action) -> 观察(Observation) -> 重复，直到能给出最终答案。
最终答案必须基于工具返回的数据。
如果遇到错误或数据不足，请如实告知用户。`
    });

async function runAgent(userQuestion) {
    await c()
    console.log(`🙋 用户提问: ${userQuestion}`);

    try {
        const stream = await agent.stream(
            { messages: [{ role: "user", content: userQuestion }] },
            { streamMode: "messages" }
        );

        //TODO 打印响应内容到控制台，模拟流式响应
        // 模拟流式输出，将响应内容逐词/逐块打印到控制台
        let fullResponse = "";
        process.stdout.write("🤖 助手回复: ");

        for await (const chunk of stream) {
            // chunk 的结构类似: { messages: [AIMessageChunk] }
            if (chunk.messages && chunk.messages.length > 0) {
                for (const msg of chunk.messages) {
                    const content = msg.content || "";
                    if (content) {
                        process.stdout.write(content);
                        fullResponse += content;
                    }
                }
            }
        }
        console.log("\n"); // 最后换行
    } catch (error) {
        console.error("Agent运行出错:", error);
        return "抱歉，处理您的问题时遇到了内部错误，请稍后重试。";
    }
}

runAgent('帮我看看2026年3月华东区卖得最好的前三个产品是啥，跟2026年4月比涨了还是跌了？')