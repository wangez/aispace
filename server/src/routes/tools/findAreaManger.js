const { z } = require("zod")
const { tool } = require("langchain")
const { Usage, User, Area, Manager } = require('../../models/busModel')

// 工具: 获取台区或用户某一年的用电量
const findAreaManager = tool(
    async ({ id, name }) => {
        let result = []   // 城西台区A
        let find
        if (id) {
            find = await Area.find({ _id: id })
        } else if (name) {
            find = await Area.find({ name })
        } else {
            return `id与name至少传入一个`
        }

        if (find && find.length) {
            result = await Manager.find({ _id: find[0].manager_id })
        } else {
            if (id) {
                return `没有找到id为${id}的台区数据`
            } else {
                return `没有找到名为${name}的台区数据`
            }
            
        }

        return result.length > 0
            ? JSON.stringify(result)
            : `未找到台区${find.name}对应的台区经理信息。`;
    },
    {
        name: "findAreaManger",
        description: "根据台区名称或id，获取该台区对应台区经理的信息",
        schema: z.object({
            name: z.string().optional().describe("台区名称，可选"),
            id: z.string().optional().describe("台区id，可选"),
        }),
    },
);

module.exports = findAreaManager