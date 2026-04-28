const AgentMessage = require('../models/agentMessage.js')

const saveChunk = async data => {
    const agentMessage = new AgentMessage(data)
    await agentMessage.save()
}

module.exports = saveChunk