// 向量查询 匹配的业务数据集合
const getVectorClient = require('../config/chromaClient.js')
const { getEmbedding } = require('./embeddingService');
const Metadata = require('../models/Metadata');
const { buildCollectionDocument } = require('../utils/schemaTextBuilder.js');

const COLLECTION_NAME = 'col_metas';

async function upsertVector(collectionName, text, vector, metadata = {}) {
    const client = await getVectorClient();
    const collection = await client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: undefined, // 禁用默认嵌入函数
    });
    const temps = await Metadata.find({ vectorExtracted: false }) // vectorExtracted: false
    if (temps.length) {
        const embeddings = []
        const docs = []
        const metadatas = []
        for (let i = 0; i < temps.length; i++) {
            const item = temps[i]
            console.log(`更新集合“${item.collectionName}”向量到向量库`)
            const doc = buildCollectionDocument(item)
            const vector = await getEmbedding(doc);
            docs.push(doc)
            embeddings.push(vector)
            metadatas.push({
                id: item._id.toString(),
                doc: doc,
                collectionName: item.collectionName
            })
        }
        await collection.add({
            ids: temps.map(item => item._id.toString()),
            embeddings,
            metadatas,
            documents: docs,
        });
        await Metadata.updateMany({ vectorExtracted: false }, { $set: { vectorExtracted: true } });
    }
}

async function querySimilarCollections(queryText, nResults = 3) {
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
    let { distances, metadatas } = results
    if (distances[0] && distances[0][0] && distances[0][0] < 1.1) {
        return [metadatas[0][0]]
    }
    return []
}

module.exports = {
    upsertVector,
    querySimilarCollections,
};