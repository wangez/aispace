const express = require('express');
const fs = require('fs')
const path = require('path')
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
                DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
                SKIP_SET_KEY: process.env.SKIP_SET_KEY
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const { DEEPSEEK_API_KEY, DASHSCOPE_API_KEY } = req.body
        process.env.DEEPSEEK_API_KEY = DEEPSEEK_API_KEY
        process.env.DASHSCOPE_API_KEY = DASHSCOPE_API_KEY
        let file = path.join(__dirname, '../../.env')
        let text = fs.readFileSync(file, 'utf-8')
        fs.writeFileSync(
            file,
            text.replace(/DEEPSEEK_API_KEY=.*/, 'DEEPSEEK_API_KEY=' + DEEPSEEK_API_KEY)
                .replace(/DASHSCOPE_API_KEY=.*/, 'DASHSCOPE_API_KEY=' + DASHSCOPE_API_KEY),
            'utf-8'
        )
        res.json({
            success: true,
            message: '设置成功',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

router.post('/skip', async (req, res) => {
    try {
        let file = path.join(__dirname, '../../.env')
        let text = fs.readFileSync(file, 'utf-8')
        fs.writeFileSync(
            file,
            `${text}
SKIP_SET_KEY=true`,
            'utf-8'
        )
        res.json({
            success: true,
            message: '设置成功',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;