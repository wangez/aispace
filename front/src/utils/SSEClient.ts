import {
    SSEEventType,
    SSEEventDataMap,
    EventHandlerMap,
    CreateConversationRequest,
} from '@/types/sse';

export interface SSEClientConfig {
    /** API 基础地址，默认 '/api/chat' */
    baseURL?: string;
    /** 获取认证 Token 的函数 */
    getToken?: () => string | null;
    /** Token 失效时的处理，默认跳转 '/login' */
    onTokenInvalid?: () => void;
}

const DEFAULT_CONFIG: Required<SSEClientConfig> = {
    baseURL: process.env.VUE_APP_API_BASE_URL + '/chat',
    getToken: () => localStorage.getItem('token'),
    onTokenInvalid: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
};

export class SSEClient {
    private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private decoder = new TextDecoder();
    private buffer = '';
    private handlers: Partial<EventHandlerMap> = {};
    private abortController: AbortController;
    private config: Required<SSEClientConfig>;

    constructor(config: SSEClientConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.abortController = new AbortController();
    }

    /**
     * 注册事件处理器（类型安全，链式调用）
     */
    on<T extends SSEEventType>(event: T, handler: (data: SSEEventDataMap[T]) => void): this {
        this.handlers[event] = handler as EventHandlerMap[T];
        return this;
    }

    /**
     * 发起 SSE 连接并处理流数据
     */
    async connect(requestBody: CreateConversationRequest): Promise<void> {
        const token = this.config.getToken();
        if (!token) {
            this.config.onTokenInvalid();
            throw new Error('No valid token found');
        }

        try {
            const response = await fetch(this.config.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
                signal: this.abortController.signal,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.config.onTokenInvalid();
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('Response body is null');
            }

            this.reader = response.body.getReader();
            await this.processStream();
        } catch (error) {
            this.handleConnectionError(error);
            throw error;
        }
    }

    /**
     * 主动取消连接
     */
    abort(): void {
        this.abortController.abort();
        this.cancelReader();
    }

    // ---------- 私有方法 ----------

    private handleConnectionError(error: unknown): void {
        if (error instanceof Error && error.name !== 'AbortError') {
            this.emit('error', {
                code: 'NETWORK_ERROR',
                message: error.message,
            });
        }
    }

    private cancelReader(): void {
        if (this.reader) {
            this.reader.cancel().catch(() => {
                // 忽略取消流时的错误（例如连接已关闭）
            });
        }
    }

    /**
     * 处理数据流读取
     */
    private async processStream(): Promise<void> {
        if (!this.reader) return;

        try {
            let done = false;
            while (!done) {
                const { value, done: streamDone } = await this.reader.read();
                done = streamDone;

                if (value) {
                    this.buffer += this.decoder.decode(value, { stream: true });
                    this.parseBuffer();
                }
            }

            // 流结束，处理剩余数据
            this.flushRemainingBuffer();
        } catch (error) {
            this.handleStreamError(error);
            throw error;
        } finally {
            this.reader?.releaseLock();
            this.reader = null;
        }
    }

    private handleStreamError(error: unknown): void {
        if (error instanceof Error && error.name !== 'AbortError') {
            this.emit('error', {
                code: 'STREAM_ERROR',
                message: error.message,
            });
        }
    }

    /**
     * 解析缓冲区中的 SSE 消息
     * 每次处理完整的消息块（以 \n\n 分隔）
     */
    private parseBuffer(): void {
        const blocks = this.buffer.split('\n\n');
        // 最后一个块可能不完整，保留到下次处理
        this.buffer = blocks.pop() || '';
        blocks.filter(block => block.trim()).forEach(block => this.processEventBlock(block))
    }

    /**
     * 流结束时强制处理剩余的 buffer 内容
     */
    private flushRemainingBuffer(): void {
        if (!this.buffer.trim()) return;

        // 作为最后一个块直接处理，且清空 buffer
        this.processEventBlock(this.buffer);
        this.buffer = '';
    }

    /**
     * 处理单个 SSE 事件块（格式：event:xxx\ndata:...\n\n）
     * 'event: delta\ndata: {"content":"您的"}'
     */
    private processEventBlock(block: string): void {
        const lines = block.split('\n');
        let eventType: SSEEventType | null = null;
        const dataLines: string[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('event:')) {
                eventType = trimmedLine.substring(6).trim() as SSEEventType;
            } else if (trimmedLine.startsWith('data:')) {
                // 去除前缀 "data:" 并移除紧随的一个空格（SSE 规范允许）
                dataLines.push(trimmedLine.substring(5).replace(/^ /, ''));
            }
        }

        if (!eventType) {
            console.warn('Received SSE block without event type, ignoring');
            return;
        }

        const dataStr = dataLines.join('\n');
        if (!dataStr) {
            console.warn(`SSE event "${eventType}" has no data`);
            return;
        }

        this.parseAndEmit(eventType, dataStr);
    }

    /**
     * 解析 JSON 数据并触发对应事件
     */
    private parseAndEmit(eventType: SSEEventType, rawData: string): void {
        try {
            const data = JSON.parse(rawData);
            this.emit(eventType, data);
        } catch (e) {
            console.error('Failed to parse SSE data:', e);
            this.emit('error', {
                code: 'PARSE_ERROR',
                message: 'Invalid JSON in SSE data',
            });
        }
    }

    /**
     * 触发事件处理器（类型安全）
     */
    private emit<T extends SSEEventType>(event: T, data: SSEEventDataMap[T]): void {
        const handler = this.handlers[event];
        console.log(data)
        if (!handler) return;

        try {
            (handler as (data: SSEEventDataMap[T]) => void)(data);
        } catch (e) {
            console.error(`Error in ${event} handler:`, e);
        }
    }
}