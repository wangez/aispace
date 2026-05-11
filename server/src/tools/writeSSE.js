// SSE 写入辅助函数
function writeSSE(res, event, data) {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
}

module.exports = writeSSE