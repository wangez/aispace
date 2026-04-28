const mongoose = require("mongoose");
const { tool } = require("langchain");
const { z } = require("zod");

// 定义 Mongoose 模型，请根据你的业务调整 Schema
const salesSchema = new mongoose.Schema({
    productId: String,
    productName: String,
    amount: Number,
    region: String,
    saleDate: Date,
}, { collection: 'sale' });

const Sales = mongoose.model("Sales", salesSchema);

// 工具1: 查询某区域、某月内销售额最高的 N 个产品
const queryTopProducts = tool(
    async ({ region, year, month, limit }) => {
        const time = Date.now()
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const results = await Sales.aggregate([
            {
                $match: {
                    region: region,
                    saleDate: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: "$productId",
                    name: { $first: "$productName" },
                    totalAmount: { $sum: "$amount" },
                },
            },
            { $sort: { totalAmount: -1 } },
            { $limit: limit },
        ]);

        console.log(`工具 queryTopProducts 花费时间${Date.now() - time}`)
        console.log(results.length > 0
            ? JSON.stringify(results)
            : `在${year}年${month}月的${region}未找到销售数据。`)
        return results.length > 0
            ? JSON.stringify(results)
            : `在${year}年${month}月的${region}未找到销售数据。`;
    },
    {
        name: "query_top_products",
        description:
            "查询指定区域和月份内，销售额最高的前N个产品。用于获取某个区域的销售排行。",
        schema: z.object({
            region: z.string().describe("要查询的区域，例如 '华东区'"),
            year: z.number().describe("年份，例如 2025"),
            month: z.number().describe("月份，例如 5"),
            limit: z.number().default(3).describe("返回的产品数量，默认为3"),
        }),
    },
);

// 工具2: 获取特定产品在指定时间段的销售额
const getProductSales = tool(
    async ({ productId, year, month }) => {
        const time = Date.now()
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const results = await Sales.aggregate([
            {
                $match: {
                    productId: productId,
                    saleDate: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: "$productId",
                    name: { $first: "$productName" },
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]);
        console.log(`工具 getProductSales 花费时间${Date.now() - time}`)
        return results.length > 0
            ? JSON.stringify(results[0])
            : `产品${productId}在${year}年${month}月无销售记录。`;
    },
    {
        name: "get_product_sales",
        description:
            "获取特定产品在指定时间段（某个月）的总销售额。用于对比产品在不同月份的销售情况。",
        schema: z.object({
            productId: z.string().describe("产品的唯一标识符"),
            year: z.number().describe("年份，例如 2025"),
            month: z.number().describe("月份，例如 6"),
        }),
    },
);

module.exports = { queryTopProducts, getProductSales };