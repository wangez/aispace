const StreamChunk = require('../models/stream.js')

const saveChunk = async data => {
    const streamChunk = new StreamChunk(data)
    await streamChunk.save()
}

module.exports = saveChunk