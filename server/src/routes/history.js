const express = require('express');
const router = express.Router();
const History = require('../models/History');

// 获取对话列表
router.get('/', async (req, res) => {
    try {
        const history = await History.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// 删除对话
router.delete('/:id', async (req, res) => {
    try {
        const employee = await History.findByIdAndDelete(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'History not found'
            });
        }

        res.json({
            success: true,
            message: 'History deleted successfully'
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