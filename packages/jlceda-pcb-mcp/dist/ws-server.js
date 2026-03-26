/**
 * WebSocket Server - MCP server-side WebSocket service
 *
 * Listens for connections from JLCEDA Pro browser extension
 */
import { WebSocketServer as WSServer } from 'ws';
import { RequestManager } from './utils/request-manager.js';
import { DEFAULT_REQUEST_TIMEOUT, /* HEALTH_CHECK_INTERVAL, */ ErrorCode } from './constants.js';
import { MCPError } from './services/error-handler.js';
export class MCPServerWebSocket {
    wss;
    clients = new Map();
    requestManager = new RequestManager();
    pendingRequests = new Map();
    healthCheckTimer;
    timeout;
    /**
     * Static factory method: Create server instance
     * - Creates WebSocket server on specified port
     *
     * @param port - Port number (default 8765)
     * @param timeout - Request timeout in milliseconds (default 120000)
     * @returns Server instance
     */
    static async create(port = 8765, timeout = DEFAULT_REQUEST_TIMEOUT) {
        // Create and return instance
        return new MCPServerWebSocket(port, timeout);
    }
    /**
     * Private constructor
     * @param port - Port number
     * @param timeout - Request timeout in milliseconds
     */
    constructor(port = 8765, timeout = DEFAULT_REQUEST_TIMEOUT) {
        this.timeout = timeout;
        this.wss = new WSServer({ port });
        this.setupServer();
        // 心跳检测已禁用，调试断连问题
        // this.startHealthCheck();
    }
    setupServer() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            this.clients.set(clientId, ws);
            const clientIp = req.socket.remoteAddress || 'unknown';
            console.error(`[MCP WS] ✅ Extension connected (${clientId}) from ${clientIp}, total clients: ${this.clients.size}`);
            ws.on('message', (data) => this.handleMessage(clientId, data));
            ws.on('close', (code, reason) => {
                console.error(`[MCP WS] ❌ Extension disconnected (${clientId}), code: ${code}, reason: ${reason.toString() || 'none'}`);
                this.clients.delete(clientId);
                // Reject all waiting requests
                for (const [id, { reject }] of this.pendingRequests) {
                    reject(new Error('Extension disconnected'));
                    this.requestManager.delete(id);
                }
                this.pendingRequests.clear();
            });
            ws.on('error', (error) => {
                console.error('[MCP WS] ⚠️ WebSocket error:', error.message);
            });
            // 监听 ping/pong
            ws.on('ping', () => {
                console.error(`[MCP WS] Ping received from ${clientId}`);
            });
            ws.on('pong', () => {
                console.error(`[MCP WS] Pong received from ${clientId}`);
            });
        });
        this.wss.on('error', (error) => {
            console.error('[MCP WS] Server error:', error);
        });
        console.error(`[MCP WS] Server listening on ws://localhost:${this.wss.options.port}`);
    }
    handleMessage(clientId, data) {
        try {
            const message = JSON.parse(data.toString());
            // 检查是否是请求消息（有 method 字段）
            if ('method' in message) {
                const request = message;
                const { id, method, params } = request;
                // 处理 shutdown 请求 - 新进程通知旧进程关闭
                if (method === 'shutdown') {
                    console.error(`[MCP WS] Received shutdown request from new process`);
                    this.handleShutdown(clientId, id, params);
                    return;
                }
                // 处理心跳ping消息
                if (method === 'ping' || id === 'heartbeat_ping') {
                    this.sendPong(clientId, id, params);
                    return;
                }
                console.error(`[MCP WS] Received request: ${method}`);
                // 其他请求消息暂不处理
                return;
            }
            // 处理响应消息
            const response = message;
            const { id, result, error } = response;
            const pending = this.pendingRequests.get(id);
            if (pending) {
                this.requestManager.delete(id);
                this.pendingRequests.delete(id);
                if (error) {
                    pending.reject(new Error(error.message));
                }
                else {
                    pending.resolve(result);
                }
            }
        }
        catch (error) {
            console.error('[MCP WS] Failed to parse message:', error);
        }
    }
    /**
     * Send pong response to heartbeat ping
     */
    sendPong(clientId, pingId, params) {
        const client = this.clients.get(clientId);
        if (!client || client.readyState !== 1) {
            console.error(`[MCP WS] ⚠️  Cannot send pong: client not ready (${clientId})`);
            return;
        }
        const clientTimestamp = params?.timestamp || Date.now();
        const serverTimestamp = Date.now();
        const latency = serverTimestamp - clientTimestamp;
        const pongResponse = {
            id: pingId,
            result: {
                status: 'ok',
                timestamp: clientTimestamp,
                serverTime: serverTimestamp,
            },
        };
        client.send(JSON.stringify(pongResponse));
        // 增强日志：显示时间、客户端ID、延迟
        const timeStr = new Date(serverTimestamp).toLocaleTimeString('zh-CN');
        console.error(`[MCP WS] 💓 Ping received from ${clientId} at ${timeStr}, latency: ${latency}ms`);
    }
    /**
     * Handle shutdown request from new process
     * Gracefully close all connections and exit
     */
    handleShutdown(clientId, requestId, _params) {
        console.error('[MCP WS] 🔄 Graceful shutdown initiated by new process...');
        // 发送响应确认
        const client = this.clients.get(clientId);
        if (client && client.readyState === 1) {
            const response = {
                id: requestId,
                result: { status: 'shutting_down', message: 'Graceful shutdown initiated' }
            };
            client.send(JSON.stringify(response));
        }
        // 延迟退出，给响应发送时间
        setTimeout(() => {
            console.error('[MCP WS] 🔌 Closing all connections...');
            this.close();
            console.error('[MCP WS] 👋 Exiting gracefully...');
            process.exit(0);
        }, 100);
    }
    /**
     * Send request to extension and wait for response
     * @param method - Method name to call
     * @param params - Method parameters
     * @param timeout - Optional timeout override
     * @returns Promise that resolves with the result
     */
    async sendRequest(method, params, timeout) {
        // 清理已断开的客户端
        this.cleanupDisconnectedClients();
        if (this.clients.size === 0) {
            throw new MCPError(ErrorCode.EXTENSION_DISCONNECTED, 'No JLCEDA extension connected', 'Please:\n1. Open JLCEDA Pro\n2. Import the WebSocket bridge extension\n3. Open a PCB or schematic document');
        }
        return new Promise((resolve, reject) => {
            // 获取第一个可用的、状态正常的客户端
            let client = null;
            for (const ws of this.clients.values()) {
                if (ws.readyState === 1) { // 1 = OPEN
                    client = ws;
                    break;
                }
            }
            if (!client) {
                reject(new MCPError(ErrorCode.EXTENSION_DISCONNECTED, 'No active WebSocket connection', 'Extension may be reconnecting. Please try again.'));
                return;
            }
            const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            const request = { id, method, params };
            const requestTimeout = timeout || this.timeout;
            const timer = setTimeout(() => {
                this.requestManager.delete(id);
                this.pendingRequests.delete(id);
                reject(new MCPError(ErrorCode.REQUEST_TIMEOUT, `Request timeout (${requestTimeout}ms). Extension may be busy or disconnected.`, 'Check if JLCEDA Pro is responsive and try again.'));
            }, requestTimeout);
            this.requestManager.set(id, timer);
            this.pendingRequests.set(id, { resolve, reject });
            client.send(JSON.stringify(request), (error) => {
                if (error) {
                    this.requestManager.delete(id);
                    this.pendingRequests.delete(id);
                    reject(error);
                }
            });
        });
    }
    /**
     * Clean up disconnected clients
     */
    cleanupDisconnectedClients() {
        for (const [id, client] of this.clients) {
            if (client.readyState !== 1) { // 1 = OPEN
                console.error(`[MCP WS] Cleaning up disconnected client (${id}), readyState: ${client.readyState}`);
                this.clients.delete(id);
            }
        }
    }
    /**
     * Check if there are connected clients
     */
    hasConnectedClients() {
        return this.clients.size > 0;
    }
    /**
     * Start health check to clean up disconnected clients
     * 已禁用：调试断连问题
     */
    // private startHealthCheck(): void {
    //   this.healthCheckTimer = setInterval(() => {
    //     for (const [id, client] of this.clients) {
    //       if (client.readyState !== 1) { // 1 = OPEN
    //         console.error(`[MCP WS] Cleaning up disconnected client (${id})`);
    //         this.clients.delete(id);
    //       }
    //     }
    //   }, HEALTH_CHECK_INTERVAL);
    // }
    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    /**
     * Close the server
     */
    close() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        this.requestManager.clear();
        this.wss.close();
    }
}
//# sourceMappingURL=ws-server.js.map