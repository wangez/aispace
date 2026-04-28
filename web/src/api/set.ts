import request from '@/utils/request'

export const getKey = (params?: object) => {
    return request.get('/set/', params)
}

export const updateKey = (data?: object) => {
    return request.post('/set/', data)
}

export const skip = (data?: object) => {
    return request.post('/set/skip', data)
}