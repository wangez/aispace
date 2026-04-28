import request from '@/utils/request'

export const getStreamList = () => {
    return request.get('/stream')
}


export const getAllChunks = (timeFleg: number) => {
    return request.get('/stream/' + timeFleg)
}