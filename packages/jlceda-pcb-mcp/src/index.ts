/**
 * JLCEDA PCB MCP Server
 *
 * MCP server for JLCEDA Pro PCB and schematic operations via WebSocket bridge extension.
 * Built with MCP SDK 1.6.1 and Zod for runtime validation.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import WebSocket from 'ws';

// WebSocket server
import { MCPServerWebSocket } from './ws-server.js';

// Windows port manager
import { WindowsPortManager } from './utils/windows-port-manager.js';

// Schemas
import * as SchematicSchemas from './schemas/schematic.js';
import * as PCBSchemas from './schemas/pcb.js';

// Services
import { handleApiError, createExtensionDisconnectedError } from './services/error-handler.js';
import {
  formatBoardOutlineMarkdown,
  formatPCBComponentsMarkdown,
  formatLayerCountMarkdown,
  formatComponentRelativePositionMarkdown,
  formatNearbyComponentsMarkdown,
  formatComponentBoundingBoxMarkdown,
  formatCollisionCheckMarkdown,
  formatOverlapCheckMarkdown,
  formatSpacingCheckMarkdown,
  truncateResponse,
} from './services/formatter.js';

// Constants
import { DEFAULT_CHARACTER_LIMIT } from './constants.js';

// Create MCP server instance
const server = new McpServer({
  name: 'jlceda-pcb-mcp',
  version: '0.2.0',
});

// WebSocket server instance (will be initialized in main)
let wsServer: MCPServerWebSocket;

/**
 * Unified tool wrapper for error handling
 */
async function executeTool(
  methodName: string,
  params: any,
  handler: (result: any) => { markdown: string; structured?: any }
): Promise<any> {
  try {
    if (!wsServer.hasConnectedClients()) {
      return createExtensionDisconnectedError();
    }

    const result = await wsServer.sendRequest(methodName, params || {});

    if (!result.success) {
      const error = handleApiError(new Error(result.error || 'Unknown error'));
      return error.toResponse();
    }

    const { markdown, structured } = handler(result);

    return {
      content: [{ type: 'text' as const, text: markdown }],
      ...(structured ? { structuredContent: structured } : {}),
    };
  } catch (error) {
    return handleApiError(error).toResponse();
  }
}

// ====================================================================
// Schematic Tools
// ====================================================================

server.registerTool(
  'sch_get_all_components',
  {
    title: '获取原理图所有元器件',
    description: `获取原理图文档中的所有元器件。

参数:
  - componentType (可选): 按元器件类型筛选
  - allSchematicPages (可选, 布尔值): 获取所有页面的元器件

返回: 包含位号、名称、类型和位置的元器件列表`,
    inputSchema: SchematicSchemas.schGetAllComponentsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => executeTool('sch.get_all_components', args, (result) => {
    const components = result.components || [];
    const markdown = `✅ Schematic Components (${result.count || components.length} total):\n\n${
      components.map((c: any, idx: number) =>
        `${idx + 1}. **${c.designator}** - ${c.name} (${c.type})\n` +
        `   - Primitive ID: ${c.primitiveId}\n` +
        `   - Position: (${c.position.x}, ${c.position.y})\n` +
        `   - Rotation: ${c.rotation}°\n`
      ).join('')
    }`;

    return {
      markdown,
      structured: { count: result.count || components.length, components },
    };
  })
);

server.registerTool(
  'sch_get_component_by_designator',
  {
    title: '按位号获取原理图元器件',
    description: `通过位号查找原理图中的特定元器件（如 R1、C1、U1）。

参数:
  - designator (必需): 元器件位号

返回: 完整的元器件信息`,
    inputSchema: SchematicSchemas.schGetComponentByDesignatorSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => executeTool('sch.get_component_by_designator', args, (result) => {
    const c = result.component;
    const markdown = `✅ Component Found: **${c.designator}**\n\n` +
      `- Primitive ID: ${c.primitiveId}\n` +
      `- Name: ${c.name}\n` +
      `- Type: ${c.type}\n` +
      `- Position: (${c.position.x}, ${c.position.y})\n` +
      `- Rotation: ${c.rotation}°\n` +
      `- Mirrored: ${c.mirror ? 'Yes' : 'No'}\n` +
      (c.manufacturer ? `- Manufacturer: ${c.manufacturer}\n` : '') +
      (c.supplierId ? `- Supplier ID: ${c.supplierId}\n` : '');

    return {
      markdown,
      structured: {
        designator: c.designator,
        primitiveId: c.primitiveId,
        name: c.name,
        type: c.type,
        position: c.position,
        rotation: c.rotation,
        mirror: c.mirror,
        manufacturer: c.manufacturer,
        supplierId: c.supplierId,
      },
    };
  })
);

server.registerTool(
  'sch_get_component_pins',
  {
    title: '获取原理图元器件引脚',
    description: `获取原理图元器件的所有引脚。

参数:
  - primitiveId (必需): 元器件图元 ID

返回: 包含引脚编号、名称、位置和网络的引脚数组`,
    inputSchema: SchematicSchemas.schGetComponentPinsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => executeTool('sch.get_component_pins', args, (result) => {
    const pins = result.pins || [];
    const markdown = `✅ Found ${result.count || pins.length} pins:\n\n${
      pins.map((p: any, idx: number) =>
        `${idx + 1}. **Pin ${p.pinNumber}**: ${p.pinName}\n` +
        `   - Primitive ID: ${p.primitiveId}\n` +
        `   - Position: (${p.position.x}, ${p.position.y})\n` +
        (p.net ? `   - Network: ${p.net}\n` : '')
      ).join('')
    }`;

    return {
      markdown,
      structured: { count: result.count || pins.length, pins },
    };
  })
);

// ====================================================================
// Schematic Netlist and BOM Tools
// ====================================================================

server.registerTool(
  'sch_get_bom',
  {
    title: '获取原理图 BOM',
    description: `获取原理图物料清单（BOM）。

参数:
  - groupByValue (可选): 按值和封装分组（默认: true）
  - includeNonBom (可选): 包含非 BOM 组件（默认: false）

返回:
  - 组件列表（designator, value, footprint）
  - 按类型分组的条目
  - 统计信息`,
    inputSchema: SchematicSchemas.schGetBomSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => executeTool('sch.get_bom', args, (result) => {
    const components = result.components || [];
    const grouped = result.grouped || [];
    const stats = result.stats;

    let markdown = 'Schematic BOM:\n\n';

    if (stats) {
      markdown += `**Statistics:**\n`;
      markdown += `- Total Components: ${stats.totalComponents}\n`;
      markdown += `- BOM Components: ${stats.bomComponents}\n`;
      markdown += `- Non-BOM Components: ${stats.nonBomComponents}\n`;
      markdown += `- Unique Part Numbers: ${stats.uniquePartNumbers}\n\n`;
    }

    if (grouped.length > 0) {
      markdown += `**Grouped by Value (${grouped.length} entries):**\n\n`;
      grouped.forEach((entry: any, i: number) => {
        markdown += `${i + 1}. ${entry.value} (${entry.footprint || 'N/A'})\n`;
        markdown += `   - Quantity: ${entry.count}\n`;
        markdown += `   - Designators: ${entry.designators.join(', ')}\n`;
        if (entry.manufacturer) {
          markdown += `   - Manufacturer: ${entry.manufacturer}\n`;
        }
        if (entry.supplierId) {
          markdown += `   - Supplier ID: ${entry.supplierId}\n`;
        }
        markdown += '\n';
      });
    }

    if (components.length > 0 && grouped.length === 0) {
      markdown += `**All Components (${components.length}):**\n\n`;
      components.slice(0, 30).forEach((c: any, i: number) => {
        markdown += `${i + 1}. ${c.designator} - ${c.value} (${c.footprint || 'N/A'})\n`;
        markdown += `   - BOM: ${c.addIntoBom ? 'Yes' : 'No'}, PCB: ${c.addIntoPcb ? 'Yes' : 'No'}\n`;
      });
      if (components.length > 30) {
        markdown += `... and ${components.length - 30} more\n`;
      }
    }

    return {
      markdown: truncateResponse(markdown, DEFAULT_CHARACTER_LIMIT, 'BOM entries'),
      structured: { components, grouped, stats },
    };
  })
);

server.registerTool(
  'sch_get_netlist_file',
  {
    title: '获取原理图网表文件 (JLCEDA格式)',
    description: `获取原理图网表文件，返回 JSON 格式的完整网表数据。

参数:
  - fileName (可选): 输出文件名 (默认: "netlist.enet")

返回 (JSON数据):
  - version: 网表版本
  - components: 元器件列表 (包含引脚和网络信息)
  - pinToNetMap: 引脚到网络的映射表
  - stats: 统计信息`,
    inputSchema: SchematicSchemas.schGetNetlistFileSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => executeTool('sch.get_netlist_file', args || {}, (result) => {
    const { version, components, nets, pinToNetMap, stats } = result;

    let markdown = `✅ JLCEDA Netlist File (Version: ${version})\n\n`;

    if (stats) {
      markdown += `**Statistics:**\n`;
      markdown += `- Components: ${stats.totalComponents}\n`;
      markdown += `- Networks: ${stats.networks}\n`;
      markdown += `- Total Pins: ${stats.totalPins}\n`;
      markdown += `- Avg Pins/Net: ${stats.avgPinsPerNet}\n\n`;
    }

    markdown += `**Components (${components.length}):**\n`;
    components.slice(0, 15).forEach((c: any, i: number) => {
      const bomMark = c.addIntoBom ? '[B]' : '';
      const pcbMark = c.addIntoPcb ? '[P]' : '';
      markdown += `${i + 1}. ${c.designator} ${bomMark}${pcbMark} - ${c.name || c.value} (${c.footprint || 'N/A'})\n`;
    });
    if (components.length > 15) {
      markdown += `... and ${components.length - 15} more\n`;
    }

    markdown += `\n**Networks (${nets.length}):**\n`;
    nets.slice(0, 10).forEach((net: any, i: number) => {
      const pins = net.pins.slice(0, 4).map((p: any) => `${p.designator}.${p.pin}`).join(', ');
      const more = net.pins.length > 4 ? `... (+${net.pins.length - 4})` : '';
      markdown += `${i + 1}. ${net.name}: ${pins}${more}\n`;
    });
    if (nets.length > 10) {
      markdown += `... and ${nets.length - 10} more\n`;
    }

    markdown += `\n**Pin-to-Network Mapping (${Object.keys(pinToNetMap).length} entries):**\n`;
    const entries = Object.entries(pinToNetMap).slice(0, 20);
    entries.forEach(([pin, net]) => {
      markdown += `  ${pin} -> ${net}\n`;
    });
    if (Object.keys(pinToNetMap).length > 20) {
      markdown += `  ... and ${Object.keys(pinToNetMap).length - 20} more\n`;
    }

    return {
      markdown: truncateResponse(markdown, DEFAULT_CHARACTER_LIMIT, 'netlist entries'),
      structured: {
        version,
        components,
        nets,
        pinToNetMap,
        stats
      },
    };
  })
);

// ====================================================================
// PCB Tools
// ====================================================================

server.registerTool(
  'pcb_get_board_outline_size',
  {
    title: '获取 PCB 板框尺寸',
    description: `获取 PCB 多种单位的尺寸。

参数:
  - unit (可选): 首选单位 ('mm' | 'mil' | 'inch')

返回: 包含所有单位和元数据的宽度和高度`,
    inputSchema: PCBSchemas.pcbGetBoardOutlineSizeSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => executeTool('pcb.get_board_outline_size', args || {}, (result) => {
    const outline = result.boardOutline;
    const markdown = formatBoardOutlineMarkdown(outline);

    return {
      markdown,
      structured: {
        widthMM: outline.widthMM,
        widthMil: outline.widthMil,
        widthInch: outline.widthInch,
        heightMM: outline.heightMM,
        heightMil: outline.heightMil,
        heightInch: outline.heightInch,
        layer: outline.layer,
        primitiveId: outline.primitiveId,
        outlineCount: outline.outlineCount,
      },
    };
  })
);

server.registerTool(
  'pcb_get_board_outline_position',
  {
    title: '获取 PCB 板框位置',
    description: `获取详细的板框位置信息，包括边界框和顶点。

返回: 边界框、中心点和所有顶点`,
    inputSchema: z.object({}),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  () => executeTool('pcb.get_board_outline_position', {}, (result) => {
    const outline = result.boardOutline;
    const bbox = outline.boundingBox;

    let markdown = '✅ PCB Board Outline Position:\n\n';
    markdown += '📍 Bounding Box:\n';
    markdown += `  - Min: (${bbox.minX.toFixed(2)}, ${bbox.minY.toFixed(2)}) mil\n`;
    markdown += `  - Max: (${bbox.maxX.toFixed(2)}, ${bbox.maxY.toFixed(2)}) mil\n`;
    markdown += `  - Center: (${bbox.centerX.toFixed(2)}, ${bbox.centerY.toFixed(2)}) mil\n`;
    markdown += `  - Size: ${bbox.width.toFixed(2)} × ${bbox.height.toFixed(2)} mil\n\n`;
    markdown += `📐 Vertices (${outline.vertices.length} points):\n`;
    outline.vertices.forEach((v: any, idx: number) => {
      markdown += `  ${idx + 1}. (${v.x.toFixed(2)}, ${v.y.toFixed(2)}) mil\n`;
    });

    return {
      markdown,
      structured: { boundingBox: bbox, vertices: outline.vertices },
    };
  })
);

server.registerTool(
  'pcb_get_all_components',
  {
    title: '获取 PCB 所有元器件',
    description: `获取 PCB 所有元器件及层级统计。

返回: 包含层级分布的元器件数组`,
    inputSchema: z.object({}),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  () => executeTool('pcb.get_all_components', {}, (result) => {
    const markdown = formatPCBComponentsMarkdown(result);

    return {
      markdown,
      structured: {
        components: result.components || [],
        stats: result.stats,
        count: result.count || (result.components?.length || 0),
      },
    };
  })
);

server.registerTool(
  'pcb_get_top_layer_components',
  {
    title: '获取 PCB 顶层元器件',
    description: `获取顶层上的所有元器件。

返回: 顶层元器件及其位置和旋转角度`,
    inputSchema: z.object({}),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  () => executeTool('pcb.get_top_layer_components', {}, (result) => {
    const components = result.components || [];
    const markdown = `✅ Top Layer Components (${components.length} total):\n\n${
      components.map((c: any, idx: number) =>
        `${idx + 1}. **${c.designator}**\n` +
        `   - Primitive ID: ${c.primitiveId}\n` +
        `   - Position: (${c.x.toFixed(2)}, ${c.y.toFixed(2)}) mil\n` +
        `   - Rotation: ${c.rotation}°\n`
      ).join('')
    }`;

    return {
      markdown,
      structured: { components, count: components.length, layer: 1, layerName: 'TOP' },
    };
  })
);

server.registerTool(
  'pcb_get_bottom_layer_components',
  {
    title: '获取 PCB 底层元器件',
    description: `获取底层上的所有元器件。

返回: 底层元器件及其位置和旋转角度`,
    inputSchema: z.object({}),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  () => executeTool('pcb.get_bottom_layer_components', {}, (result) => {
    const components = result.components || [];
    const markdown = `✅ Bottom Layer Components (${components.length} total):\n\n${
      components.map((c: any, idx: number) =>
        `${idx + 1}. **${c.designator}**\n` +
        `   - Primitive ID: ${c.primitiveId}\n` +
        `   - Position: (${c.x.toFixed(2)}, ${c.y.toFixed(2)}) mil\n` +
        `   - Rotation: ${c.rotation}°\n`
      ).join('')
    }`;

    return {
      markdown,
      structured: { components, count: components.length, layer: 2, layerName: 'BOTTOM' },
    };
  })
);

server.registerTool(
  'pcb_find_component_by_designator',
  {
    title: '按位号查找 PCB 元器件',
    description: `通过位号查找 PCB 元器件（包含原始封装尺寸，不考虑旋转）。

参数:
  - designator (必需): 元器件位号

返回: 完整的元器件信息，包含原始封装的宽度和高度`,
    inputSchema: PCBSchemas.pcbFindComponentByDesignatorSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => executeTool('pcb.find_component_by_designator', args, (result) => {
    const c = result.component;

    let markdown = `✅ Found Component: **${c.designator}**\n\n` +
      `- Primitive ID: ${c.primitiveId}\n` +
      `- Layer: Layer ${c.layer} (${c.layer === 1 ? 'TOP' : c.layer === 2 ? 'BOTTOM' : 'Other'})\n` +
      `- Position: (${c.x.toFixed(2)}, ${c.y.toFixed(2)}) mil\n` +
      `- Rotation: ${c.rotation}°\n`;

    // 仅当 width 和 height 存在时才显示尺寸信息
    if (c.width !== undefined && c.height !== undefined) {
      markdown += `- Size (original): ${c.width.toFixed(1)} x ${c.height.toFixed(1)} mil\n` +
        `  (${(c.width * 0.0254).toFixed(2)} x ${(c.height * 0.0254).toFixed(2)} mm)\n`;
    } else {
      markdown += `- Size (original): N/A (封装尺寸信息不可用)\n`;
    }

    return {
      markdown,
      structured: {
        designator: c.designator,
        primitiveId: c.primitiveId,
        layer: c.layer,
        x: c.x,
        y: c.y,
        rotation: c.rotation,
        width: c.width,
        height: c.height,
      },
    };
  })
);

server.registerTool(
  'pcb_get_component_pads',
  {
    title: '获取 PCB 元器件焊盘',
    description: `获取 PCB 元器件的所有焊盘。

参数:
  - primitiveId (必需): 元器件图元 ID

返回: 包含位置的焊盘数组`,
    inputSchema: PCBSchemas.pcbGetComponentPadsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => executeTool('pcb.get_component_pads', args, (result) => {
    const pads = result.pads || [];
    const markdown = `✅ Found ${result.count || pads.length} pads:\n\n${
      pads.map((p: any, idx: number) =>
        `${idx + 1}. Pad **${p.padNumber}**\n` +
        `   - Primitive ID: ${p.primitiveId}\n` +
        `   - Position: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) mil\n`
      ).join('')
    }`;

    return {
      markdown,
      structured: { pads, count: result.count || pads.length },
    };
  })
);

server.registerTool(
  'pcb_set_component_transform',
  {
    title: '设置 PCB 元器件变换属性',
    description: `设置元器件的位置、旋转角度和/或层级。

参数:
  - designator (必需): 元器件位号
  - x (可选): X 坐标 (mil)
  - y (可选): Y 坐标 (mil)
  - rotation (可选): 旋转角度 (度)
  - layer (可选): 层级 (1=顶层, 2=底层)

返回: 更新后的元器件信息`,
    inputSchema: PCBSchemas.pcbSetComponentTransformSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => executeTool('pcb.set_component_transform', args, (result) => {
    const c = result.component;
    const markdown = `✅ Component Transform Updated: **${c.designator}**\n\n` +
      `- Primitive ID: ${c.primitiveId}\n` +
      `- Layer: Layer ${c.layer} (${c.layer === 1 ? 'TOP' : c.layer === 2 ? 'BOTTOM' : 'Other'})\n` +
      `- Position: (${c.x.toFixed(2)}, ${c.y.toFixed(2)}) mil\n` +
      `- Rotation: ${c.rotation}°\n`;

    return {
      markdown,
      structured: {
        designator: c.designator,
        primitiveId: c.primitiveId,
        layer: c.layer,
        x: c.x,
        y: c.y,
        rotation: c.rotation,
      },
    };
  })
);

server.registerTool(
  'pcb_generate_netlist_map',
  {
    title: '生成 PCB 网表映射',
    description: `生成完整的引脚到网络映射。

参数:
  - maxNetworks (可选): 最大显示网络数
  - maxComponents (可选): 最大显示元器件数
  - maxPinsPerNet (可选): 每个网络最大显示引脚数

返回: 网络映射和统计信息`,
    inputSchema: PCBSchemas.pcbGenerateNetlistMapSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => executeTool('pcb.generate_netlist_map', {}, (result) => {
    const netToPinsMap = result.netToPinsMap || {};
    const componentToNetsMap = result.componentToNetsMap || {};
    const stats = result.stats;
    const topNets = result.topNets || [];

    const maxNetworks = args?.maxNetworks || 0;
    const maxComponents = args?.maxComponents || 0;
    const maxPinsPerNet = args?.maxPinsPerNet || 0;

    let markdown = '✅ PCB Netlist Map Generated:\n\n';

    if (stats) {
      markdown += '📊 Statistics:\n';
      markdown += `- Networks: ${stats.totalNets}\n`;
      markdown += `- Connections: ${stats.totalConnections}\n`;
      markdown += `- Components: ${stats.totalComponents}\n`;
      markdown += `- Avg pins/net: ${stats.avgPinsPerNet.toFixed(1)}\n\n`;
    }

    if (topNets.length > 0) {
      markdown += '🔌 Top 10 Networks:\n';
      topNets.forEach((item: any, idx: number) => {
        markdown += `${idx + 1}. ${item.net}: ${item.pinCount} pins\n`;
      });
      markdown += '\n';
    }

    const netNames = Object.keys(netToPinsMap).sort();
    const displayNets = maxNetworks > 0 ? netNames.slice(0, maxNetworks) : netNames;

    if (displayNets.length > 0) {
      markdown += `📋 Network → Pins (${maxNetworks > 0 ? `First ${displayNets.length}/${netNames.length}` : `All ${netNames.length}`}):\n\n`;
      displayNets.forEach(net => {
        const pins = netToPinsMap[net];
        const displayPins = maxPinsPerNet > 0 ? pins.slice(0, maxPinsPerNet) : pins;
        markdown += `${net} (${pins.length} pins):\n`;
        displayPins.forEach((pin: any) => {
          markdown += `  - ${pin.designator}/${pin.padNumber}\n`;
        });
        if (maxPinsPerNet > 0 && pins.length > maxPinsPerNet) {
          markdown += `  ... and ${pins.length - maxPinsPerNet} more\n`;
        }
        markdown += '\n';
      });
    }

    const componentNames = Object.keys(componentToNetsMap).sort();
    const displayComponents = maxComponents > 0 ? componentNames.slice(0, maxComponents) : componentNames;

    if (displayComponents.length > 0) {
      markdown += `🔗 Component → Networks (${maxComponents > 0 ? `First ${displayComponents.length}/${componentNames.length}` : `All ${componentNames.length}`}):\n\n`;
      displayComponents.forEach(designator => {
        const nets = componentToNetsMap[designator];
        markdown += `${designator}: [${nets.join(', ')}]\n`;
      });
    }

    const truncatedMarkdown = truncateResponse(markdown, DEFAULT_CHARACTER_LIMIT, 'networks');

    return {
      markdown: truncatedMarkdown,
      structured: {
        netToPinsMap,
        componentToNetsMap,
        stats,
        topNets,
      },
    };
  })
);

server.registerTool(
  'pcb_get_layer_count',
  {
    title: '获取 PCB 层数',
    description: `获取 PCB 的铜层数量和统计信息。

返回:
  - 顶层 (TOP) 是否存在
  - 底层 (BOTTOM) 是否存在
  - 内层数量 (INNER_1 到 INNER_32)
  - 总铜层数
  - 所有图层定义数量
  - 已启用图层数量

无参数要求`,
    inputSchema: PCBSchemas.pcbGetLayerCountSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  () => executeTool('pcb.get_layer_count', {}, (result) => {
    const markdown = formatLayerCountMarkdown(result);

    return {
      markdown,
      structured: {
        layerCount: result.layerCount,
      },
    };
  })
);

server.registerTool(
  'pcb_calculate_component_relative_position',
  {
    title: '计算PCB元器件相对位置',
    description: `计算两个PCB元器件之间的相对位置信息。

参数:
  - designator1 (必需): 第一个元器件位号（如"R1"）
  - designator2 (必需): 第二个元器件位号（如"U1"）
  - unit (可选): 输出单位（mm/mil/inch，默认mm）

返回:
  - 两个元器件的详细信息
  - 距离（多种单位）
  - 角度（0-360度，从comp1指向comp2）
  - 方位描述（8方向和16方向）
  - 层级信息（是否在同一层）`,
    inputSchema: PCBSchemas.pcbCalculateComponentRelativePositionSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => executeTool('pcb.calculate_component_relative_position', args, (result) => {
    const markdown = formatComponentRelativePositionMarkdown(result, args?.unit || 'mm');

    return {
      markdown,
      structured: {
        component1: result.component1,
        component2: result.component2,
        relativePosition: result.relativePosition,
        sameLayer: result.sameLayer,
      },
    };
  })
);


server.registerTool(
  'pcb_find_nearby_components',
  {
    title: '查找邻近器件',
    description: `查找指定参考器件周围的邻近器件。支持多种查询模式：

**KNN模式（K最近邻）**:
  - searchMode: "knn"
  - k: 返回最近的N个器件（默认5）

**半径模式**:
  - searchMode: "radius"
  - maxDistance: 最大距离
  - unit: 距离单位（mm/mil/inch，默认mil）

**方向模式**:
  - searchMode: "direction"
  - direction: 方向（N/S/E/W/NE/NW/SE/SW）
  - maxDistance: 最大距离

**边界盒重叠检测（默认启用）**:
  - useBoundingBoxOverlap: 启用精确边界盒检测（默认true）
  - boundingBoxType: "raw"（原始尺寸）或 "actual"（含安全裕量，默认raw）

返回:
  - 参考器件信息
  - 邻近器件列表（含距离、角度、方向、重叠状态）
  - overlapping: 真实边界盒重叠状态（不再硬编码为false）
  - boundingBox: 可选的边界盒详细信息（minX, minY, maxX, maxY, width, height）
  - 统计信息（执行时间、密度等）
  - DFM警告（重叠、间距不足）`,
    inputSchema: PCBSchemas.pcbFindNearbyComponentsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => {
    return executeTool('pcb.find_nearby_components', args, (result) => {
      const markdown = formatNearbyComponentsMarkdown(result, args?.unit || 'mil');

      return {
        markdown,
        structured: {
          reference: result.reference,
          nearbyComponents: result.nearbyComponents,
          statistics: result.statistics,
          warnings: result.warnings,
        },
      };
    });
  }
);

server.registerTool(
  'pcb_calculate_component_bounding_box',
  {
    title: '计算PCB元器件封装边界盒',
    description: `计算PCB元器件封装的边界盒（Bounding Box），包括几何尺寸和安全裕量。

参数:
  - designator (必需): 元器件位号
  - safetyMargin (可选): 安全裕量，单位mil（默认50mil ≈ 1.27mm）
  - unit (可选): 输出单位（mm/mil/inch，默认mm）

返回:
  - 原始边界盒（未考虑安全裕量）
  - 实际边界盒（含安全裕量）
  - 多单位尺寸（mm/mil/inch）
  - 元器件基本信息
  - 计算详情（焊盘数、执行时间、警告等）`,
    inputSchema: PCBSchemas.pcbCalculateComponentBoundingBoxSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => executeTool('pcb.calculate_component_bounding_box', args, (result) => {
    const bbox = result.boundingBox;
    const markdown = formatComponentBoundingBoxMarkdown(bbox, args?.unit || 'mm');

    return {
      markdown,
      structured: {
        boundingBox: bbox,
      },
    };
  })
);

server.registerTool(
  'pcb_check_component_collision',
  {
    title: '🔧 [内部] 检测器件碰撞和间距（底层API）',
    description: `⚠️ **内部使用**：此工具是 \`pcb_check_component_overlap\` 和 \`pcb_check_component_spacing\` 的底层实现。

**推荐使用**：
  - 仅检查重叠：请使用 \`pcb_check_component_overlap\`
  - 仅检查间距：请使用 \`pcb_check_component_spacing\`

**检测模式**:
  - checkMode: "spacing" - 仅检查间距
  - checkMode: "overlap" - 仅检查边界盒重叠
  - checkMode: "both" - 同时检查间距和重叠（默认）

**参数**:
  - referenceDesignator: 参考器件位号
  - checkMode: 检测模式（spacing/overlap/both）
  - minSpacing: 最小间距要求（spacing模式需要）
  - boundingBoxType: "raw" 或 "actual"（默认raw）
  - unit: 距离单位（mm/mil/inch）
  - layer: 层级过滤

**返回**:
  - 违规器件列表（含间距/重叠详情）
  - 统计信息
  - DFM警告`,
    inputSchema: PCBSchemas.pcbCheckComponentCollisionSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => {
    return executeTool('pcb.check_component_collision', args, (result) => {
      const markdown = formatCollisionCheckMarkdown(result, args?.unit || 'mil');

      return {
        markdown,
        structured: {
          reference: result.reference,
          violations: result.violations,
          statistics: result.statistics,
          warnings: [
            ...(result.warnings || []),
            {
              type: 'deprecation',
              message: '建议使用 pcb_check_component_overlap 或 pcb_check_component_spacing 专用工具',
              severity: 'warning',
            },
          ],
        },
      };
    });
  }
);

server.registerTool(
  'pcb_check_component_overlap',
  {
    title: '检测器件重叠',
    description: `检测PCB器件之间的边界盒重叠。

**参数**:
  - referenceDesignator: 参考器件位号（如"R1", "U1"）
  - boundingBoxType: "raw"（原始尺寸）或 "actual"（含安全裕量，默认raw）
  - layer: 层级过滤（top/bottom/all，默认all）
  - excludeDesignators: 排除检查的器件位号列表
  - maxResults: 最大返回结果数（默认100）

**返回**:
  - 重叠器件列表（含重叠面积、边界盒信息）
  - 统计信息
  - DFM警告`,
    inputSchema: PCBSchemas.pcbCheckComponentOverlapSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => {
    // 内部调用后端时仍使用 checkMode='overlap'
    return executeTool('pcb.check_component_collision', { ...args, checkMode: 'overlap' }, (result) => {
      const markdown = formatOverlapCheckMarkdown(result);

      return {
        markdown,
        structured: {
          reference: result.reference,
          violations: result.violations,
          statistics: result.statistics,
          warnings: result.warnings,
        },
      };
    });
  }
);

server.registerTool(
  'pcb_check_component_spacing',
  {
    title: '检测器件间距',
    description: `检测PCB器件之间的间距违规（使用边界盒边缘间隙计算）。

**参数**:
  - referenceDesignator: 参考器件位号（如"R1", "U1"）
  - minSpacing: 最小间距要求（必需）
  - boundingBoxType: "raw"（原始尺寸）或 "actual"（含安全裕量，默认raw）
  - unit: 距离单位（mm/mil/inch，默认mil）
  - layer: 层级过滤（top/bottom/all，默认all）
  - excludeDesignators: 排除检查的器件位号列表
  - maxResults: 最大返回结果数（默认100）

**计算方式**:
  - 距离计算：边界盒到边界盒的边缘间隙（非中心点距离）
  - 边缘间隙 = 两个边界盒最近边缘之间的最短距离
  - 重叠时距离 = 0

**返回**:
  - 间距违规器件列表（含实际间隙、要求间隙、不足量）
  - 统计信息
  - DFM警告`,
    inputSchema: PCBSchemas.pcbCheckComponentSpacingSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  (args) => {
    // 内部调用后端时仍使用 checkMode='spacing'
    return executeTool('pcb.check_component_collision', { ...args, checkMode: 'spacing' }, (result) => {
      const markdown = formatSpacingCheckMarkdown(result, args?.unit || 'mil');

      return {
        markdown,
        structured: {
          reference: result.reference,
          violations: result.violations,
          statistics: result.statistics,
          warnings: result.warnings,
        },
      };
    });
  }
);

// ====================================================================
// Main Server Startup
// ====================================================================

/**
 * Notify old MCP process to gracefully shutdown
 * @param port - WebSocket port
 * @returns true if shutdown was acknowledged, false otherwise
 */
async function notifyOldProcessShutdown(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const wsUrl = `ws://localhost:${port}`;
    console.error(`[MCP] Notifying old process at ${wsUrl} to shutdown...`);

    const ws = new WebSocket(wsUrl, { handshakeTimeout: 3000 });

    const timeout = setTimeout(() => {
      console.error('[MCP] Shutdown notification timeout, old process may not be responding');
      ws.close();
      resolve(false);
    }, 5000);

    ws.on('open', () => {
      console.error('[MCP] Connected to old process, sending shutdown request...');
      const shutdownRequest = {
        id: `shutdown_${Date.now()}`,
        method: 'shutdown',
        params: { newProcessPid: process.pid }
      };
      ws.send(JSON.stringify(shutdownRequest));
    });

    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.result?.status === 'shutting_down') {
          console.error('[MCP] ✅ Old process acknowledged shutdown');
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        }
      } catch (e) {
        // Ignore parse errors
      }
    });

    ws.on('error', (error) => {
      console.error(`[MCP] Failed to connect to old process: ${error.message}`);
      clearTimeout(timeout);
      resolve(false);
    });

    ws.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

async function main() {
  try {
    console.error(`[MCP] ========================================`);
    console.error(`[MCP] Server starting at ${new Date().toISOString()}`);
    console.error(`[MCP] Process PID: ${process.pid}`);
    console.error(`[MCP] Parent PID: ${process.ppid}`);
    console.error(`[MCP] Command line: ${process.argv.join(' ')}`);
    console.error(`[MCP] ========================================`);

    const port = 8765;
    const portManager = new WindowsPortManager();
    const currentPid = process.pid;

    // Step 1: Check port status and handle graceful handoff
    console.error(`[MCP] Checking port ${port}... (current PID: ${currentPid})`);
    const portInfo = await portManager.detectPortOccupancy(port);

    if (portInfo.isOccupied && portInfo.pid && portInfo.pid !== currentPid) {
      console.error(`[MCP] Port ${port} is occupied by PID ${portInfo.pid}`);

      // 尝试通知旧进程优雅关闭
      const shutdownSuccess = await notifyOldProcessShutdown(port);
      if (shutdownSuccess) {
        console.error(`[MCP] ✅ Old process shutdown successfully`);
        // 等待端口释放
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.error(`[MCP] ⚠️ Could not notify old process, attempting to kill it...`);
        await portManager.killProcess(portInfo.pid);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 再次检查端口
      const recheckInfo = await portManager.detectPortOccupancy(port);
      if (recheckInfo.isOccupied && recheckInfo.pid !== currentPid) {
        console.error(`[MCP] ⚠️ Port ${port} still occupied, cannot start`);
        process.exit(1);
      }
    }

    console.error(`[MCP] Port ${port} is available, starting server...`);

    // Step 2: Initialize WebSocket server
    wsServer = await MCPServerWebSocket.create(port);

    // Step 3: Wait for extension connection (up to 10 seconds)
    console.error('[MCP] Waiting for extension connection...');
    const maxWaitTime = 10000; // 10 seconds
    const checkInterval = 500; // 500ms
    let waited = 0;

    while (!wsServer.hasConnectedClients() && waited < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
      console.error(`[MCP] Waiting for extension... ${waited / 1000}s`);
    }

    if (wsServer.hasConnectedClients()) {
      console.error('[MCP] ✅ Extension connected!');
    } else {
      console.error('[MCP] ⚠️ No extension connected, proceeding anyway...');
    }

    // Step 4: Connect MCP transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('JLCEDA PCB MCP Server running');
    console.error('  - MCP stdio: active');
    console.error('  - WebSocket server: ws://localhost:8765');
    console.error('  - Version: 0.2.0 (MCP SDK 1.6.1)');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Debug: Log process exit reasons
process.on('exit', (code) => {
  console.error(`[MCP] Process exiting with code: ${code}`);
});

process.on('SIGTERM', () => {
  console.error('[MCP] Received SIGTERM');
});

process.on('SIGINT', () => {
  console.error('[MCP] Received SIGINT');
});

process.on('uncaughtException', (error) => {
  console.error('[MCP] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[MCP] Unhandled rejection:', reason);
});
