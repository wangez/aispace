import request from '@/utils/request'

export const getAll = (params?: object) => {
    return request.get('/embedding/', params)
}

export const doEmbedding = (data?: object) => {
    return request.post('/embedding/', data)
}

export const updateMeta = (data?: object) => {
    return request.post('/embedding/updateMeta', data)
}