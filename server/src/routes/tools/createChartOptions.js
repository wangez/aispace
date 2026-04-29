const { z } = require("zod")
const { tool } = require("langchain")
const { Usage, User, Area } = require('../../models/busModel')

// 工具: 获取台区或用户某一年的用电量
const createChartOptions = tool(
    async ({ chartName, xAxisData, values, units }) => {
        let json = JSON.stringify({
            title: {
                text: chartName,
                left: 'center'
            },
            xAxis: {
                type: 'category',
                data: xAxisData
            },
            yAxis: {
                type: 'value',
                name: units
            },
            series: [
                {
                    data: values,
                    type: 'line'
                }
            ]
        })
        return '@@@echarts' + json + '@@@';
    },
    {
        name: "create_chart_options",
        description: "生成echarts图表配置",
        schema: z.object({
            chartName: z.string().describe("图表名称，例如 2025年城北台区C月用电量"),
            xAxisData: z.array(z.string()).describe("类目数据数组，例如 ['1月', '2月']"),
            values: z.array(z.number()).describe("数值数组，例如 [12.5, 19.1]"),
            units: z.string().describe("数值单位，例如 千瓦时（kWh）"),
        }),
    },
);

module.exports = createChartOptions