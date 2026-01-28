/**
 * JLCEDA API 类型定义
 */
export interface JLCEDAComponent {
    ref: string;
    footprint: string;
    position: {
        x: number;
        y: number;
    };
    rotation: number;
    layer: string;
}
export interface JLCEDATrace {
    net: string;
    points: Array<{
        x: number;
        y: number;
    }>;
    width: number;
    layer: string;
}
export interface JLCEDAVia {
    position: {
        x: number;
        y: number;
    };
    drillSize: number;
    size: number;
    net?: string;
}
export interface JLCEDALayer {
    id: string;
    name: string;
    type: string;
    visible: boolean;
}
export interface JLCEDABoardInfo {
    width: number;
    height: number;
    layers: number;
    boardOutline?: {
        points: Array<{
            x: number;
            y: number;
        }>;
    };
}
//# sourceMappingURL=api.d.ts.map