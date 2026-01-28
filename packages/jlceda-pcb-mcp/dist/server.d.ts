/**
 * WebSocket Client - Communicates with JLCEDA Pro extension
 */
export interface WebSocketClientConfig {
    url?: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    requestTimeout?: number;
}
export declare class WebSocketClient {
    private ws;
    private requestManager;
    private reconnectAttempts;
    private isManualClose;
    private reconnectTimer?;
    private readonly config;
    private pendingPromises;
    constructor(config?: WebSocketClientConfig);
    private connect;
    private handleMessage;
    private scheduleReconnect;
    send(method: string, params?: Record<string, unknown>): Promise<any>;
    close(): void;
    isConnected(): boolean;
}
//# sourceMappingURL=server.d.ts.map