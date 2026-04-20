const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Session = require('../models/Session');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// 注册用户
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 检查用户是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }
        // 创建新用户
        const user = new User({ username, password });
        await user.save();

        res.status(201).json({
            success: true,
            message: 'User registered successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 查找用户
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // 验证密码
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // 生成唯一 Token
        const token = uuidv4();

        // 将 Token 与用户信息存入 Session 集合
        await Session.create({
            token,
            userId: user._id,
            username: user.username,
            role: user.role,
            style: user.style
        });

        // 返回 Token 给客户端
        res.json({
            message: '登录成功',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                style: user.style
            },
        });


    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

router.post('/logout', authMiddleware, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.substring(7);
        // 删除数据库中的会话记录
        await Session.deleteOne({ token });
        res.json({ message: '已退出登录' });
    } catch (error) {
        res.status(500).json({ message: '退出失败' });
    }
});

module.exports = router;