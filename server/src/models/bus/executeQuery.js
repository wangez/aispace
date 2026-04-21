require('./Book')
require('./Movie')
require('./Order')
require('./Tv')
const { busConnection } = require('../../config/database')

/**
 * 安全执行 MongoDB 查询 (这里简化，实际需更严格校验)
 */
async function executeQuery(collectionName, queryCode) {
    const model = busConnection.model(collectionName);

    // 危险函数黑名单
    if (queryCode.includes('drop') || queryCode.includes('remove') || queryCode.includes('update')) {
        throw new Error('只允许查询操作');
    }

    // 使用 Function 构造器执行，传入 model 作为上下文
    const func = new Function('m', `return (${queryCode})();`);
    return await func(model);
}

module.exports = { executeQuery };