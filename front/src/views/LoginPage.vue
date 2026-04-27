<template>
    <div class="login-container">
        <div class="login-wrapper">
            <!-- 左侧装饰区域 -->
            <div class="login-left">
                <div class="welcome-text">
                    <h1>欢迎回来</h1>
                    <p>登录您的账户，开始使用我们的服务</p>
                </div>
                <div class="decorative-graphics">
                    <div class="graphic-circle"></div>
                    <div class="graphic-square"></div>
                    <div class="graphic-triangle"></div>
                </div>
            </div>

            <!-- 右侧登录表单 -->
            <div class="login-right">
                <div class="login-form-wrapper">
                    <div class="login-header">
                        <h2>用户登录</h2>
                        <p>请输入您的账号和密码</p>
                    </div>

                    <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form"
                        @submit.prevent="handleLogin">
                        <!-- 账号输入 -->
                        <el-form-item prop="username">
                            <el-input v-model="loginForm.username" placeholder="请输入用户名" size="large"
                                :prefix-icon="User" />
                        </el-form-item>

                        <!-- 密码输入 -->
                        <el-form-item prop="password">
                            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large"
                                :prefix-icon="Lock" show-password />
                        </el-form-item>

                        <!-- 记住我 & 忘记密码 -->
                        <div class="form-options">
                            <el-checkbox v-model="loginForm.rememberMe">
                                记住我
                            </el-checkbox>
                        </div>

                        <!-- 登录按钮 -->
                        <el-form-item>
                            <el-button type="primary" size="large" class="login-button" :loading="loginLoading"
                                native-type="submit">
                                {{ loginLoading ? '登录中...' : '立即登录' }}
                            </el-button>
                        </el-form-item>
                    </el-form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// ---- 引用依赖 ----
import { ref, reactive, onMounted } from 'vue'
import { type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
// ---- 引用方法 ----
import { login } from '@/api/auth'

const router = useRouter()
const loginFormRef = ref<FormInstance>()

// 表单数据
interface LoginForm {
    username: string
    password: string
    rememberMe: boolean
}

const loginForm = reactive<LoginForm>({
    username: '',
    password: '',
    rememberMe: false
})

// 加载状态
const loginLoading = ref(false)

// 表单验证规则
const loginRules: FormRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ]
}

// 处理登录
const handleLogin = async () => {
    if (!loginFormRef.value) return

    const isValid = await loginFormRef.value.validate()
    if (!isValid) return

    loginLoading.value = true

    try {
        // 模拟登录请求
        const res = await login({ ...loginForm })
        localStorage.setItem('token', res.data.token)
        ElMessage.success('登录成功！')
        router.push('/')
    } catch (error) {
        ElMessage.error('登录失败，请检查账号密码')
    } finally {
        loginLoading.value = false
    }
}

// 组件挂载时检查记住我
onMounted(() => {
    const savedUsername = localStorage.getItem('rememberedUsername')
    if (savedUsername) {
        loginForm.username = savedUsername
        loginForm.rememberMe = true
    }
})
</script>

<style lang="less" scoped>
.login-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    font-family: 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.login-wrapper {
    flex: 1;
    display: flex;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 40px 20px;
    align-items: center;
    justify-content: center;
}

.login-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    position: relative;
    min-height: 500px;

    .welcome-text {
        text-align: center;
        margin-bottom: 60px;

        h1 {
            font-size: 2.5rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        p {
            font-size: 1.1rem;
            color: #666;
            line-height: 1.6;
        }
    }

    .decorative-graphics {
        position: relative;
        width: 300px;
        height: 300px;

        .graphic-circle {
            position: absolute;
            top: 50px;
            left: 50px;
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            opacity: 0.1;
            animation: float 8s ease-in-out infinite;
        }

        .graphic-square {
            position: absolute;
            top: 100px;
            left: 100px;
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            opacity: 0.1;
            transform: rotate(45deg);
            animation: float 6s ease-in-out infinite reverse;
        }

        .graphic-triangle {
            position: absolute;
            top: 150px;
            left: 150px;
            width: 0;
            height: 0;
            border-left: 50px solid transparent;
            border-right: 50px solid transparent;
            border-bottom: 86.6px solid rgba(76, 201, 240, 0.1);
            animation: float 10s ease-in-out infinite;
        }
    }
}

.login-right {
    flex: 0 0 450px;
    background: white;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    animation: slideIn 0.8s ease-out;

    .login-form-wrapper {
        .login-header {
            text-align: center;
            margin-bottom: 40px;

            h2 {
                font-size: 1.8rem;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 8px;
            }

            p {
                color: #7f8c8d;
                font-size: 0.95rem;
            }
        }
    }
}

.login-form {
    .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
    }

    .login-button {
        width: 100%;
        height: 50px;
        font-size: 1.1rem;
        font-weight: 500;
        border-radius: 25px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        transition: all 0.3s ease;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        &:active {
            transform: translateY(0);
        }
    }
}

// 动画定义
@keyframes float {

    0%,
    100% {
        transform: translateY(0) rotate(0deg);
    }

    50% {
        transform: translateY(-20px) rotate(5deg);
    }
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(30px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

// 响应式设计
@media (max-width: 992px) {
    .login-wrapper {
        flex-direction: column;
    }

    .login-left {
        display: none;
    }

    .login-right {
        flex: 1;
        width: 100%;
        max-width: 400px;
    }
}

@media (max-width: 480px) {
    .login-right {
        padding: 30px 20px;
    }

    .login-left .welcome-text h1 {
        font-size: 2rem;
    }
}
</style>