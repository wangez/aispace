import 'dotenv/config';
import { ChatDeepSeek } from '@langchain/deepseek';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import readline from 'readline';

// ----------------------------- 配置模型 -----------------------------
const model = new ChatDeepSeek({
    model: 'deepseek-chat',   // 也可用 deepseek-reasoner（推理模型）
    temperature: 0.7,
});

// ----------------------------- 提示词模板（示例2） -----------------------------
// 系统提示模板，支持动态角色、语气等
const systemPromptTemplate = ChatPromptTemplate.fromMessages([
    ['system', '你是一个{role}。你的回答风格是{style}。请记住用户之前说的内容。'],
]);

// ----------------------------- 构建 LCEL 链（示例3） -----------------------------
// 注意：多轮对话中，链不能直接包含历史消息，因此我们只将“当前用户消息+历史消息”一起传给模型
// 但为了展示 LCEL 的用法，这里创建一个简单的“格式化系统提示 + 输出解析”的链
// 实际对话逻辑在下面用函数实现，链用于单次生成时的后处理
const outputParser = new StringOutputParser();

// 这个链只负责将系统提示格式化后 + 模型 + 输出解析（实际调用时还要传入历史消息）
// 因为历史消息无法放入同一个 LCEL 链（需要动态拼接），所以我们将 LCEL 用于系统提示的生成部分
const formatSystemPrompt = async (role, style) => {
    const formatted = await systemPromptTemplate.format({ role, style });
    return formatted; // 返回字符串形式的系统提示
};

// ----------------------------- 多轮对话逻辑（示例5） -----------------------------
// 存储对话历史（符合 OpenAI 格式）
let messages = [];

// 初始化系统提示（可以自定义角色和风格）
const ROLE = '热情且耐心的编程导师';
const STYLE = '幽默、使用比喻';
const systemPrompt = await formatSystemPrompt(ROLE, STYLE);
messages.push({ role: 'system', content: systemPrompt });


// 创建 readline 接口用于接收用户输入
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// 提问函数（返回 Promise）
const askQuestion = (query) => {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
};

// ----------------------------- 流式输出函数（示例4） -----------------------------
async function streamResponse(userMessage) {
    // 将用户消息加入历史
    messages.push({ role: 'user', content: userMessage });

    // 调用模型流式接口
    const stream = await model.stream(messages);

    let fullResponse = '';
    process.stdout.write('🤖: ');
    for await (const chunk of stream) {
        const content = chunk.content;
        if (content) {
            fullResponse += content;
            process.stdout.write(content);
        }
    }
    console.log('\n'); // 换行

    // 将 AI 回复加入历史
    messages.push({ role: 'assistant', content: fullResponse });
}

// ----------------------------- 主循环 -----------------------------
async function main() {
    while (true) {
        const userInput = await askQuestion('👤 你: ');
        if (userInput.toLowerCase() === 'exit') {
            console.log('👋 再见！');
            break;
        }
        if (!userInput.trim()) continue;

        await streamResponse(userInput);
    }
    rl.close();
}

// 启动
main().catch(console.error);