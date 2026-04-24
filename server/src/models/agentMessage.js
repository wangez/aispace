const mongoose = require("mongoose");

const agentMessageSchema = new mongoose.Schema({
    messageList: String,
    timeFleg: Number,
}, { collection: 'agentMessage' });

const AgentMessage = mongoose.model("AgentMessage", agentMessageSchema);

module.exports = AgentMessage