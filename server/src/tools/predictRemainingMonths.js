/**
 * 根据历史数据预测当年剩余月份的数据
 * @param {number[][]} historicalData - 历史各年数据，每年为一个长度为12的数组
 * @param {number[]} currentYearData - 当年已有的月份数据，长度1~11
 * @returns {number[]} 当年剩余月份的预测值数组
 */
function predictRemainingMonths(historicalData, currentYearData) {
    // ---------- 1. 输入校验 ----------
    if (!Array.isArray(historicalData) || historicalData.length === 0) {
        throw new Error('历史数据不能为空');
    }
    if (!Array.isArray(currentYearData) || currentYearData.length === 0 || currentYearData.length >= 12) {
        throw new Error('当年数据必须包含1至11个月的数值');
    }

    // 确保每年都有12个月
    historicalData.forEach((year, idx) => {
        if (!Array.isArray(year) || year.length !== 12) {
            throw new Error(`第${idx + 1}年历史数据长度必须为12`);
        }
    });

    const knownMonths = currentYearData.length;
    const remainingMonths = 12 - knownMonths;

    // ---------- 2. 计算历史各年总量与季节指数 ----------
    const annualTotals = historicalData.map(year => year.reduce((sum, val) => sum + val, 0));

    // 每年各月比例 (value / annualTotal)
    const seasonalRatios = historicalData.map((year, i) => {
        const total = annualTotals[i];
        if (total === 0) {
            // 避免除以零，全年为零则各月均匀分配
            return new Array(12).fill(1 / 12);
        }
        return year.map(val => val / total);
    });

    // 平均季节指数
    const avgSeasonalIndex = new Array(12).fill(0);
    for (let m = 0; m < 12; m++) {
        let sum = 0;
        for (let y = 0; y < historicalData.length; y++) {
            sum += seasonalRatios[y][m];
        }
        avgSeasonalIndex[m] = sum / historicalData.length;
    }

    // 归一化（确保总和为1，防止浮点误差）
    const indexSum = avgSeasonalIndex.reduce((a, b) => a + b, 0);
    for (let m = 0; m < 12; m++) {
        avgSeasonalIndex[m] /= indexSum;
    }

    // ---------- 3. 基于已知月份估算全年总量 ----------
    const knownActualSum = currentYearData.reduce((sum, val) => sum + val, 0);
    const knownSeasonalSum = avgSeasonalIndex.slice(0, knownMonths).reduce((a, b) => a + b, 0);

    let estimatedTotal = null;

    if (knownSeasonalSum > 1e-6) {
        // 主要方法：用已知月份反推全年总量
        estimatedTotal = knownActualSum / knownSeasonalSum;
    }

    // ---------- 4. 趋势基线（备选） ----------
    let trendTotal = null;
    if (annualTotals.length >= 2) {
        // 计算最近一年的总量，并用平均增长率推算当年
        const lastTotal = annualTotals[annualTotals.length - 1];
        const firstTotal = annualTotals[0];
        const n = annualTotals.length;

        if (firstTotal > 0) {
            const avgGrowthRate = Math.pow(lastTotal / firstTotal, 1 / (n - 1)) - 1;
            // 限制增长率范围，避免极端值
            const clampedRate = Math.max(-0.5, Math.min(avgGrowthRate, 1.0));
            trendTotal = lastTotal * (1 + clampedRate);
        }
    } else if (annualTotals.length === 1) {
        // 只有一年历史数据，直接用该年的总量作为趋势
        trendTotal = annualTotals[0];
    }

    // ---------- 5. 融合估计值与趋势值 ----------
    let finalTotal;
    if (estimatedTotal !== null && trendTotal !== null) {
        // 已知月份占比越大，估计值越可靠；占比越小，越依赖趋势
        const knownRatio = Math.min(knownMonths / 12, 1);
        const weight = Math.sqrt(knownRatio); // 平滑过渡，可调参数
        finalTotal = estimatedTotal * weight + trendTotal * (1 - weight);
    } else if (estimatedTotal !== null) {
        finalTotal = estimatedTotal;
    } else if (trendTotal !== null) {
        finalTotal = trendTotal;
    } else {
        throw new Error('无法计算全年预测量：历史数据总量异常');
    }

    // 避免总量为负或零
    if (finalTotal <= 0) {
        throw new Error('预测全年总量必须为正数');
    }

    // ---------- 6. 分配剩余月份 ----------
    const predictions = [];
    for (let m = knownMonths; m < 12; m++) {
        const predicted = finalTotal * avgSeasonalIndex[m];
        predictions.push(Math.max(0, predicted)); // 确保非负
    }

    return predictions;
}

// ---------- 示例调用 ----------
// 历史数据：2019~2022 年各月数据
const history = [
    [120, 130, 145, 160, 175, 190, 210, 220, 200, 180, 150, 130], // 2019
    [125, 135, 150, 170, 180, 195, 220, 230, 210, 185, 155, 135], // 2020
    [130, 140, 155, 175, 190, 205, 235, 240, 215, 195, 160, 140], // 2021
    [135, 145, 160, 185, 200, 215, 240, 250, 225, 200, 165, 145], // 2022
];

// 当年已知数据：1月～3月
const current = [140, 152, 168];

const remainingPredictions = predictRemainingMonths(history, current);
console.log('预测剩余月份数据：', remainingPredictions);
// 输出类似：[188.7, 204.1, 219.5, 245.3, ...]

module.exports = predictRemainingMonths