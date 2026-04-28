// 请求体类型
export interface CreateConversationRequest {
  content: string;
  historyId: string | undefined;
}

// SSE 事件类型枚举
export type SSEEventType = 'meta' | 'delta' | 'done' | 'error';

// Meta 事件数据结构
export interface MetaEventData {
  historyId: string;
  chatId: string;
}

// Delta 事件数据结构
export interface DeltaEventData {
  content: string | undefined;
  reasoning: string | undefined;
}

// Done 事件数据结构
export interface DoneEventData {
  status: 'success' | 'cancelled';
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Error 事件数据结构
export interface ErrorEventData {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// 联合事件数据类型
export type SSEEventDataMap = {
  meta: MetaEventData;
  delta: DeltaEventData;
  done: DoneEventData;
  error: ErrorEventData;
};

// 通用 SSE 事件对象
export interface SSEEvent<T extends SSEEventType = SSEEventType> {
  event: T;
  data: SSEEventDataMap[T];
}

export interface EventHandlerMap {
  meta?: (data: MetaEventData) => void;
  delta?: (data: DeltaEventData) => void;
  done?: (data: DoneEventData) => void;
  error?: (data: ErrorEventData) => void;
}