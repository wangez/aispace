// 问题类型分类   区分聊天 还是 业务数据查询
const getVectorClient = require('../config/chromaClient.js')
const { getEmbedding } = require('./embeddingService');
const { QuestionTemp } = require('../models/QuestionTemp')

const COLLECTION_NAME = 'qt_list';

async function upsertQTVector() {
    const client = await getVectorClient();
    const collection = await client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: undefined, // 禁用默认嵌入函数
    });
    const temps = await QuestionTemp.find({ vectorExtracted: false }) // vectorExtracted: false
    if (temps.length) {
        const embeddings = []
        for (let i = 0; i < temps.length; i++) {
            console.log(`更新问题“${temps[i].text}”向量到向量库`)
            const vector = await getEmbedding(temps[i].text);
            embeddings.push(vector)
        }
        await collection.add({
            ids: temps.map(item => item._id.toString()),
            embeddings,
            metadatas: temps.map(item => {
                return { role: item.role }
            }),
            documents: temps.map(item => item.text),
        });
        await QuestionTemp.updateMany({ vectorExtracted: false }, { $set: { vectorExtracted: true } });
    }
}

async function queryQTSimilarCollections(queryText, nResults = 1) {
    const queryVector = await getEmbedding(queryText);

    const client = await getVectorClient();
    const collection = await client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: undefined,
    });
    const results = await collection.query({
        queryEmbeddings: [queryVector],
        nResults,
    });
    console.log(results)
    let metadatas = results.metadatas[0] || []
    if (metadatas.length) {
        return metadatas[0]
    }
    return ''
}

module.exports = {
    upsertQTVector,
    queryQTSimilarCollections,
};