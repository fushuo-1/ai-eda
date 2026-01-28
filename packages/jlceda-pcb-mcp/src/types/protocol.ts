/**
 * WebSocket 通信协议类型定义
 */

export interface WebSocketRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
}

export interface WebSocketResponse {
  id: string;
  result?: unknown;
  error?: WebSocketError;
}

export interface WebSocketError {
  code: number;
  message: string;
}

// PCB 操作相关类型
export interface PlaceComponentParams {
  ref: string;
  footprint: string;
  x: number;
  y: number;
  rotation?: number;
  layer?: string;
}

export interface MoveComponentParams {
  ref: string;
  x: number;
  y: number;
  rotation?: number;
}

export interface RouteTraceParams {
  net: string;
  points: Array<{ x: number; y: number }>;
  width: number;
  layer: string;
}

export interface AddViaParams {
  x: number;
  y: number;
  drillSize: number;
  size: number;
  net?: string;
}

export interface CreateProjectParams {
  name: string;
  boardWidth: number;
  boardHeight: number;
  layers?: number;
}

export interface DRCReport {
  errors: Array<{
    type: string;
    message: string;
    position?: { x: number; y: number };
  }>;
  warnings: Array<{
    type: string;
    message: string;
    position?: { x: number; y: number };
  }>;
}

export interface ProjectInfo {
  name: string;
  path: string;
  board: {
    width: number;
    height: number;
    layers: number;
  };
}
