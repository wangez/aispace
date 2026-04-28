import axios from 'axios'

// 创建axios实例
const request = axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL || '',
    timeout: 10000
})
// 请求拦截器
request.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        config.headers && (config.headers.Authorization = `Bearer ${token}`)
        return config
    },
    error => {
        // 对请求错误做些什么
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    response => {
        // 对响应数据做点什么
        return response
    },
    error => {
        // 对响应错误做点什么
        if (error.response) {
            if (error.response.status === 401) {
                // token过期，跳转到登录页
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                location.href = '/login'
                return Promise.resolve({data: { data: [] }})
            } else if (error.response.status === 402) {
                // 未设置key，跳转到key设置页面
                location.href = '/set'
                return Promise.resolve({data: { data: [] }})
            }
        }
        return Promise.reject(error)
    }
)

export default request




