/**
 * WebSocket Client - Communicates with JLCEDA Pro extension
 */

import WebSocket from 'ws';
import { RequestManager } from './utils/request-manager.js';
import { MAX_RECONNECT_ATTEMPTS, DEFAULT_RECONNECT_INTERVAL, DEFAULT_REQUEST_TIMEOUT } from './constants.js';
import type {
  WebSocketRequest,
  WebSocketResponse,
} from './types/protocol.js';

export interface WebSocketClientConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  requestTimeout?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private requestManager = new RequestManager();
  private reconnectAttempts = 0;
  private isManualClose = false;
  private reconnectTimer?: NodeJS.Timeout;

  private readonly config: Required<WebSocketClientConfig>;

  // Store pending promises
  private pendingPromises = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();

  constructor(config: WebSocketClientConfig = {}) {
    this.config = {
      url: config.url || 'ws://localhost:8765',
      reconnectInterval: config.reconnectInterval || DEFAULT_RECONNECT_INTERVAL,
      maxReconnectAttempts: config.maxReconnectAttempts || MAX_RECONNECT_ATTEMPTS,
      requestTimeout: config.requestTimeout || DEFAULT_REQUEST_TIMEOUT,
    };

    this.connect();
  }

  private connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.on('open', () => {
        console.error(`[JLCEDA-MCP] Connected to ${this.config.url}`);
        this.reconnectAttempts = 0;
      });

      this.ws.on('message', (data: Buffer) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('close', () => {
        console.error('[JLCEDA-MCP] Connection closed');
        this.ws = null;

        // Reject all pending promises
        for (const [id, { reject }] of this.pendingPromises) {
          reject(new Error('Connection closed'));
          this.pendingPromises.delete(id);
        }

        // Schedule reconnection
        if (!this.isManualClose) {
          this.scheduleReconnect();
        }
      });

      this.ws.on('error', (error) => {
        console.error('[JLCEDA-MCP] WebSocket error:', error);
      });
    } catch (error) {
      console.error('[JLCEDA-MCP] Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketResponse = JSON.parse(data);
      const { id, result, error } = message;

      const pending = this.pendingPromises.get(id);
      if (pending) {
        this.requestManager.delete(id);
        this.pendingPromises.delete(id);

        if (error) {
          pending.reject(new Error(error.message));
        } else {
          pending.resolve(result);
        }
      }
    } catch (error) {
      console.error('[JLCEDA-MCP] Failed to parse message:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[JLCEDA-MCP] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff: 2s, 4s, 8s, 16s, ... (max 30s)
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.error(`[JLCEDA-MCP] Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  async send(method: string, params: Record<string, unknown> = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const self = this;

      // Ensure connection exists
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        // Wait for connection to be established
        const waitForConnection = () => {
          if (self.ws && self.ws.readyState === WebSocket.OPEN) {
            doSend();
          } else if (self.reconnectAttempts < self.config.maxReconnectAttempts) {
            setTimeout(waitForConnection, 500);
          } else {
            reject(new Error('Unable to establish connection'));
          }
        };
        waitForConnection();
        return;
      }

      doSend();

      function doSend() {
        if (!self.ws) {
          reject(new Error('WebSocket is not connected'));
          return;
        }

        const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const request: WebSocketRequest = { id, method, params };

        const timer = setTimeout(() => {
          if (self.requestManager.delete(id)) {
            self.pendingPromises.delete(id);
            reject(new Error('Request timeout'));
          }
        }, self.config.requestTimeout);

        self.requestManager.set(id, timer);
        self.pendingPromises.set(id, { resolve, reject });

        self.ws.send(JSON.stringify(request), (error) => {
          if (error) {
            self.requestManager.delete(id);
            self.pendingPromises.delete(id);
            reject(error);
          }
        });
      }
    });
  }

  close(): void {
    this.isManualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.requestManager.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
