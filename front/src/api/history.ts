import request from '@/utils/request'

export const getAll = (params?: object) => {
    return request.get('/history/', params)
}

export const createNew = (data?: object) => {
    return request.post('/history/', data)
}