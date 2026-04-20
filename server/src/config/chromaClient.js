const { ChromaClient } = require('chromadb');

let clientInstance = null;

async function getVectorClient() {
    if (!clientInstance) {
        clientInstance = new ChromaClient();  // 嵌入式模式：直接 new ChromaClient()
        await clientInstance.heartbeat();
        console.log('ChromaDB 客户端初始化成功 (嵌入式模式)');
    }
    return clientInstance;
}

module.exports = getVectorClient