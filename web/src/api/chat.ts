import request from '@/utils/request'
import { SSEClient } from '@/utils/SSEClient';
import { CreateConversationRequest } from '@/types/sse';

export const getAll = (hiastoryId: string) => {
    return request.get('/chat/' + hiastoryId)
}

export const createNew = async (data: CreateConversationRequest) => {
    const client = new SSEClient();
    client.connect(data);
    return client
}
