import 'dotenv/config';
import { ChatDeepSeek } from '@langchain/deepseek';

const model = new ChatDeepSeek({
    model: 'deepseek-chat',      // 可选 deepseek-reasoner（推理模型）
    temperature: 0,               // 0 最确定，0.7 更随机
});

const res = await model.invoke('用一句话解释什么是RAG');
console.log(res.content);