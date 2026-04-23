const { tool } = require('ai')
const { z } = require('zod')


// 工具1：查询区域Top产品
export const queryTopProducts = tool({
    description: '查询指定区域、指定月份内销售额最高的产品列表',
    "type": "function",
    parameters: z.object({
        region: z.string().describe('区域名称，如：华东区'),
        month: z.string().describe('月份，格式为 YYYY-MM，例如 2025-03'),
        limit: z.number().optional().describe('返回的产品数量，默认为 3')
    }),
    execute: async ({ region, month, limit = 3 }) => {
        // 这里接入真实数据源，示例返回模拟数据
        console.log(`[Tool] 查询 ${region} ${month} 销售额 Top ${limit}`);

        // 模拟数据库查询结果
        const mockProducts = [
            { name: '智能手表X1', sales: 158000 },
            { name: '无线耳机Pro', sales: 123500 },
            { name: '折叠键盘K3', sales: 89000 }
        ];

        return {
            region,
            month,
            topProducts: mockProducts.slice(0, limit)
        };
    }
});

// 工具2：查询特定产品销售额
export const getProductSales = tool({
    description: '查询特定产品在指定月份的销售额',
    "type": "function",
    parameters: z.object({
        productName: z.string().describe('产品名称'),
        month: z.string().describe('月份，格式为 YYYY-MM，例如 2025-03')
    }),
    execute: async ({ productName, month }) => {
        console.log(`[Tool] 查询产品 ${productName} 在 ${month} 的销售额`);

        // 模拟数据
        const mockSalesData = {
            '智能手表X1': 158000,
            '无线耳机Pro': 123500,
            '折叠键盘K3': 89000
        };

        return {
            productName,
            month,
            sales: mockSalesData[productName] || 0
        };
    }
});