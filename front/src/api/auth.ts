import request from '@/utils/request'

// 带参数的另一种写法
export const login = (data: object) => {
    return request.post('/auth/login', data)
}