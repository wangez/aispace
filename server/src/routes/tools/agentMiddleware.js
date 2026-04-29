const { createMiddleware } = require("langchain")
const AgentMessage = require('../../models/agentMessage.js')

function agentMiddleware(systemPrompt) {
    const middleware = []
    if (process.env.SAVE_AGENT_MESSAGE === '2') {
        middleware.push(createMiddleware({
            name: "afterAgent",
            afterAgent: (state) => {
                let messages = [
                    {
                        id: [null, null, 'SystemPrompt'],
                        kwargs: {
                            content: systemPrompt
                        }
                    },
                    ...state.messages
                ]

                const agentMessage = new AgentMessage({
                    messageList: JSON.stringify(messages, null, 2),
                    timeFleg: Date.now()
                })
                agentMessage.save()  // 不阻塞
                return;
            }
        }))
    }
    return middleware
}

module.exports = agentMiddleware