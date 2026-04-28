const mongoose = require("mongoose");

const agentMessageSchema = new mongoose.Schema(
    {
        messageList: String,
        timeFleg: Number,
    },
    { collection: '_util_agent_message' }
);

const AgentMessage = mongoose.model("AgentMessage", agentMessageSchema);

module.exports = AgentMessage