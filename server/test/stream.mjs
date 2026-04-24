import dotenv from 'dotenv'
import z from "zod";
import { createAgent, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai"
dotenv.config();

const model = new ChatOpenAI({
    model: "deepseek-chat",                     // DeepSeek 模型名称
    temperature: 0,
    apiKey: process.env.DEEPSEEK_API_KEY,       // 从环境变量读取 API Key
    configuration: {
        baseURL: "https://api.deepseek.com/v1",   // DeepSeek API 地址
    },
});

const getWeather = tool(
    async ({ city }) => {
        return `It's always sunny in ${city}!`;
    },
    {
        name: "get_weather",
        description: "Get weather for a given city.",
        schema: z.object({ city: z.string() }),
    },
);

const agent = createAgent({
    model,
    tools: [getWeather],
});

for await (const [token, metadata] of await agent.stream(
    { messages: [{ role: "user", content: "What is the weather in SF?" }] },
    { streamMode: "messages" },
)) {
    if (!token.contentBlocks) continue;
    const reasoning = token.contentBlocks.filter((b) => b.type === "reasoning");
    const text = token.contentBlocks.filter((b) => b.type === "text");
    if (reasoning.length) {
        process.stdout.write(`[thinking] ${reasoning[0].reasoning}`);
    }
    if (text.length) {
        process.stdout.write(text[0].text);
    }
}