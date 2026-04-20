const OpenAI = require('openai');

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const EMBEDDING_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const MODEL_NAME = 'text-embedding-v4';
const VECTOR_DIM = 1024;

const client = new OpenAI({
    apiKey: DASHSCOPE_API_KEY,
    baseURL: EMBEDDING_URL
});

async function getEmbedding(text) {
    try {
        const completion = await client.embeddings.create({
            model: MODEL_NAME,
            input: text,
            dimensions: VECTOR_DIM,
            encoding_format: "float"
        });
        const embedding = completion.data[0].embedding;
        if (!embedding || embedding.length !== VECTOR_DIM) {
            throw new Error('无效的嵌入响应');
        }
        return embedding;
    } catch (error) {
        console.error('DashScope 嵌入错误:', error.response?.data || error.message);
        throw new Error('生成嵌入失败');
    }
}

module.exports = { getEmbedding };