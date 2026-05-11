const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
        },
        style: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { collection: '_sys_user' }
);

// 密码加密中间件
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;  // 抛出错误，Mongoose 会处理
    }
});

// 验证密码方法
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('SysUser', userSchema);