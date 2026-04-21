const express = require('express');
const fs = require('fs')
const path = require('path')
const router = express.Router();
const History = require('../models/History');

router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
                DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY
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

module.exports = router;