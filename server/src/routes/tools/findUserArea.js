const { z } = require("zod")
const { tool } = require("langchain")
const { Usage, User, Area } = require('../../models/busModel')

// 工具: 获取台区或用户某一年的用电量
const get12MounthUsage = tool(
    async ({ type, year, name }) => {
        let result = []   // 城西台区A
        if (type === '台区') {
            const find = await Area.find({ name })
            if (find && find.length) {
                result = await Usage.aggregate([
                    {
                        $lookup: {
                            from: User.collection.name,          // 实际集合名称，通常是模型名的小写复数
                            localField: 'user_id',
                            foreignField: '_id',
                            as: 'user'
                        }
                    },
                    { $unwind: '$user' },
                    {
                        $match: {
                            'user.area_id': find[0]._id,
                            year_month: { $gte: year + '-01', $lte: year + '-12' }
                        }
                    },
                    {
                        $group: {
                            _id: '$year_month',
                            total_usage: { $sum: '$usage' }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]);
            } else {
                return `没有找到名为${name}的台区数据`
            }
        } else {
            const find = await User.find({ name })
            if (find.length > 1) {
                // 有重名用户
            } else if (find.length) {
                result = await Usage.find({
                    user_id: find[0]._id,
                    year_month: { $gte: '2025-01', $lte: '2025-12' }
                })
                    .sort({ year_month: 1 })  // 按月份升序
                    .select('year_month usage -_id'); // 只返回需要的字段
            } else {
                return `没有找到用户名为${name}的数据`
            }
        }

        return result.length > 0
            ? JSON.stringify(result)
            : `${type}${name}在${year}年无用电量记录。`;
    },
    {
        name: "get_product_sales",
        description: "获取台区或用户某年12个月每个月的用电量, 不满12个月有多少返回多少",
        schema: z.object({
            type: z.string().describe("查询目标是台区还是用户，例如 台区"),
            year: z.number().describe("年份，例如 2025"),
            name: z.string().describe("台区名称或者用户名称，例如 城西街道5号"),
        }),
    },
);

module.exports = get12MounthUsage