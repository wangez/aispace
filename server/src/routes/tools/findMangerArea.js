const { z } = require("zod")
const { tool } = require("langchain")
const { Usage, User, Area, Manager } = require('../../models/busModel');
const { find } = require("../../models/SysHistory");

const findMangerArea = tool(
    async ({ id, name }) => {
        let result = []   // 城西台区A
        let _id
        if (id) {
            _id = id
        } else if (name) {
            find = await Manager.find({ name })
            if (find && find.length) {
                _id = find[0]._id
            } else {
                return `没有找到名为${name}的台区经理`
            }
        } else {
            return 'id与name至少传入一个'
        }

        result = await Area.find({ manager_id: _id })

        return result.length > 0
            ? JSON.stringify(result)
            : `未找到台区经理${find.name}管辖的台区。`;
    },
    {
        name: "findMangerArea",
        description: "根据台区经理名称或id，获取对应台区的信息",
        schema: z.object({
            name: z.string().optional().describe("台区经理名称，可选"),
            id: z.string().optional().describe("台区经理id，可选"),
        }),
    },
);

module.exports = findMangerArea