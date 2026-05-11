import request from '@/utils/request'

export const getStreamList = () => {
    return request.get('/agent')
}


export const getAllChunks = (timeFleg: number) => {
    return request.get('/agent/' + timeFleg)
}