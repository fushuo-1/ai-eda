# claude-eda

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

AI 辅助 EDA 工具包，通过 MCP (Model Context Protocol) 实现 Claude AI 与嘉立创EDA Pro 的深度集成。

## 特性

- **双向通信**：Claude AI 可直接读取和操作嘉立创EDA Pro 设计
- **原理图操作**：获取元器件信息、引脚数据、网络连接
- **PCB 操作**：板框尺寸、层级统计、元器件布局、网表分析
- **DFM 检测**：器件重叠检测、间距检查、邻近器件查找
- **实时交互**：基于 WebSocket 的低延迟通信
- **类型安全**：完整的 TypeScript 类型定义

## 架构概览

```
┌─────────────────┐        WebSocket          ┌─────────────────┐
│   Claude AI     │ ◄─────────────────────► │  MCP Server     │
│  (MCP Client)   │      ws://localhost:8765  │  (Node.js)      │
└─────────────────┘                            └────────┬────────┘
                                                       │
                                                       │ 嘉立创EDA API
                                                       ▼
                                              ┌─────────────────┐
                                              │  Browser Ext.   │
                                              │  (JLCEDA Pro)   │
                                              └─────────────────┘
```

### 核心组件

- **MCP Server** ([`jlceda-pcb-mcp`](./packages/jlceda-pcb-mcp)): Node.js 服务器，实现 MCP 协议
- **Browser Extension** ([`pro-api-sdk`](./packages/pro-api-sdk)): 嘉立创EDA Pro 浏览器扩展，提供 WebSocket 桥接

## 快速开始

### 前置要求

- **Node.js** >= 18.0.0 (推荐 20+)
- **嘉立创EDA Pro** 专业版账户
- **Claude Desktop** 或其他 MCP 客户端

### 1. 安装依赖

```bash
# 安装 MCP 服务器依赖
cd packages/jlceda-pcb-mcp
npm install

# 安装浏览器扩展依赖（可选，用于开发）
cd ../pro-api-sdk
npm install
```

### 2. 构建项目

```bash
# 构建 MCP 服务器
cd packages/jlceda-pcb-mcp
npm run build

# 构建浏览器扩展（可选）
cd ../pro-api-sdk
npm run build
```

### 3. 启动 MCP 服务器

```bash
cd packages/jlceda-pcb-mcp
npm start
```

服务器将在 `ws://localhost:8765` 启动。

### 4. 安装浏览器扩展

1. 在嘉立创EDA Pro 中打开菜单
2. 选择 "扩展管理" → "导入扩展"
3. 导入 `packages/pro-api-sdk/dist/pro-api-sdk_v1.0.0.eext`
4. 初始化扩展并连接到本地服务器

### 5. 配置 Claude Desktop

在 Claude Desktop 配置文件中添加：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "jlceda-pcb": {
      "command": "node",
      "args": ["d:/OneDrive/ai-eda/packages/jlceda-pcb-mcp/dist/index.js"]
    }
  }
}
```

## 可用工具

### 原理图工具 (Schematic)

| 工具名                              | 描述               |
| ----------------------------------- | ------------------ |
| `sch_get_all_components`          | 获取所有元器件     |
| `sch_get_component_by_designator` | 按位号查找元器件   |
| `sch_get_component_pins`          | 获取元器件引脚信息 |

### PCB 工具

| 工具名                                        | 描述                     |
| --------------------------------------------- | ------------------------ |
| `pcb_get_board_outline_size`                | 获取板框尺寸             |
| `pcb_get_board_outline_position`            | 获取板框位置信息         |
| `pcb_get_all_components`                    | 获取所有元器件           |
| `pcb_get_top_layer_components`              | 获取顶层元器件           |
| `pcb_get_bottom_layer_components`           | 获取底层元器件           |
| `pcb_find_component_by_designator`          | 按位号查找元器件         |
| `pcb_get_component_pads`                    | 获取元器件焊盘           |
| `pcb_set_component_transform`               | 设置元器件位置/旋转/层级 |
| `pcb_generate_netlist_map`                  | 生成网表映射             |
| `pcb_get_layer_count`                       | 获取 PCB 层数            |
| `pcb_calculate_component_relative_position` | 计算元器件相对位置       |
| `pcb_find_nearby_components`                | 查找邻近器件             |
| `pcb_calculate_component_bounding_box`      | 计算元器件边界盒         |
| `pcb_check_component_overlap`               | 检测器件重叠             |
| `pcb_check_component_spacing`               | 检测器件间距             |

### 示例对话

```
用户: 帮我检查一下 R1 和周围器件的间距

Claude: 我来帮您检查 R1 周围器件的间距情况。

[调用 pcb_find_nearby_components，designator="R1"]
[调用 pcb_check_component_spacing，referenceDesignator="R1", minSpacing=100]

根据分析结果：
- R1 位于顶层，坐标 (1234.5, 567.8)
- 发现 3 个邻近器件
- R2 与 R1 间距为 150mil ✓ 符合要求
- C1 与 R1 间距为 80mil ⚠️ 低于推荐值 100mil
```

## 开发

### 项目结构

```
packages/
├── jlceda-pcb-mcp/          # MCP 服务器
│   ├── src/
│   │   ├── index.ts         # MCP 工具注册
│   │   ├── server.ts        # WebSocket 服务器
│   │   ├── ws-server.ts     # WebSocket 消息处理
│   │   ├── schemas/         # Zod 验证模式
│   │   ├── services/        # 业务逻辑
│   │   ├── tools/           # 工具函数
│   │   └── types/           # 类型定义
│   └── dist/                # 编译输出
│
└── pro-api-sdk/             # 浏览器扩展
    ├── src/
    │   ├── index.ts         # 扩展入口
    │   ├── connection-manager.ts  # 连接管理
    │   ├── websocket-client.ts    # WebSocket 客户端
    │   ├── sch-api-adapter.ts     # 原理图 API 适配
    │   ├── pcb-api-adapter.ts     # PCB API 适配
    │   └── protocol.ts      # 协议类型定义
    └── dist/
        └── pro-api-sdk_v1.0.0.eext
```

### 常用命令

```bash
# MCP 服务器开发
cd packages/jlceda-pcb-mcp
npm run build      # 编译
npm run dev        # 监听模式


# 浏览器扩展开发
cd packages/pro-api-sdk
npm run compile    # 编译
npm run build      # 打包
npm run fix        # 代码格式化
```

### 代码规范

- **TypeScript 严格模式**：所有文件必须启用严格类型检查
- **API 调用**：直接使用全局 `eda` 对象，不导入、不实例化
- **全局状态**：使用 `globalThis` 管理扩展全局状态
- **命名规范**：
  - 文件名：`camelCase.ts` 或 `kebab-case.ts`
  - 类名：`PascalCase`
  - 接口/类型：`PascalCase`

### WebSocket 协议

- 请求格式：`{id, method, params}`
- 响应格式：`{id, result?, error?}`
- 方法命名：`domain.action` (如 `sch.get_component`)

## 故障排除

### 端口占用

如果端口 8765 被占用，MCP 服务器会自动尝试释放端口。如果失败，请手动停止占用进程：

```bash
# Windows
netstat -ano | findstr :8765
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8765 | xargs kill -9
```

### 连接失败

1. 确认 MCP 服务器已启动：`npm start`
2. 查看嘉立创EDA Pro 控制台（F12）检查扩展日志
3. 确认扩展已连接：菜单 → WebSocket 桥接器 → 显示连接状态

### API 调用错误

检查参数格式，查看扩展控制台日志（F12）。注意以下已知问题：

- `eda.sch_Netlist.getNetlist()` 存在 BUG

## 文档

- [嘉立创EDA 扩展 API 文档](https://prodocs.lceda.cn/cn/api/guide/)
- [SYS_WebSocket 参考](https://prodocs.lceda.cn/cn/api/reference/pro-api.sys_websocket.html)
- [SCH_PrimitiveComponent API](https://prodocs.lceda.cn/cn/api/reference/pro-api.sch_primitivecomponent.html)

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**注意**: 本项目需要嘉立创EDA Pro 专业版账户才能使用浏览器扩展功能。
