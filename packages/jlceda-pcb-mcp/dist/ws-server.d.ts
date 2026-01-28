/**
 * WebSocket Server - MCP server-side WebSocket service
 *
 * Listens for connections from JLCEDA Pro browser extension
 */
export declare class MCPServerWebSocket {
    private wss;
    private clients;
    private requestManager;
    private pendingRequests;
    private healthCheckTimer?;
    private readonly timeout;
    /**
     * Static factory method: Create server instance
     * - Creates WebSocket server on specified port
     *
     * @param port - Port number (default 8765)
     * @param timeout - Request timeout in milliseconds (default 120000)
     * @returns Server instance
     */
    static create(port?: number, timeout?: number): Promise<MCPServerWebSocket>;
    /**
     * Private constructor
     * @param port - Port number
     * @param timeout - Request timeout in milliseconds
     */
    private constructor();
    private setupServer;
    private handleMessage;
    /**
     * Send pong response to heartbeat ping
     */
    private sendPong;
    /**
     * Send request to extension and wait for response
     * @param method - Method name to call
     * @param params - Method parameters
     * @param timeout - Optional timeout override
     * @returns Promise that resolves with the result
     */
    sendRequest(method: string, params: any, timeout?: number): Promise<any>;
    /**
     * Check if there are connected clients
     */
    hasConnectedClients(): boolean;
    /**
     * Start health check to clean up disconnected clients
     */
    private startHealthCheck;
    /**
     * Generate unique client ID
     */
    private generateClientId;
    /**
     * Close the server
     */
    close(): void;
}
//# sourceMappingURL=ws-server.d.ts.map