const Session = require('../models/Session');

module.exports = async (req, res, next) => {
    let url = req.url
    if (url.indexOf('/api/set/') !== 0 && url.indexOf('/api/auth/') !== 0) {
        console.log(url)
        console.log('DEEPSEEK_API_KEY', process.env.DEEPSEEK_API_KEY, 'DASHSCOPE_API_KEY', process.env.DASHSCOPE_API_KEY)
        console.log(!process.env.DEEPSEEK_API_KEY, !process.env.DASHSCOPE_API_KEY)
        if (!process.env.DEEPSEEK_API_KEY && !process.env.DASHSCOPE_API_KEY) {
            return res.status(402).json({ message: '未设置模型key' });
        }
    }

    // 获取 Authorization 头
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '未提供有效的认证令牌' });
    }

    const token = authHeader.substring(7); // 去除 'Bearer ' 前缀

    try {
        // 查询 Token 对应的会话记录
        const session = await Session.findOne({ token });
        if (!session) {
            return res.status(401).json({ message: '令牌无效或已过期，请重新登录' });
        }

        // 将用户信息挂载到 req 对象，供后续路由使用
        req.user = {
            id: session.userId,
            username: session.username,
            role: session.role,
            style: session.style
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
};