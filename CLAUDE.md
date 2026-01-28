# ai-eda

AI 辅助 EDA 工具包，通过 MCP 实现 Claude AI 与嘉立创EDA Pro 的深度集成。

## 技术栈

**运行时**

- Node.js 18+ (推荐 20+)
- Bun (开发环境)

**核心依赖**

- TypeScript 5.3 (严格模式)
- MCP SDK 0.6.0
- WebSocket (ws 8.18.0)

**平台 API**

- 嘉立创EDA Pro 扩展 API (全局 `eda` 对象)

## 项目结构

```
packages/
├── jlceda-pcb-mcp/          # MCP 服务器
│   ├── src/
│   │   ├── index.ts         # MCP 工具注册
│   │   ├── server.ts        # WebSocket 服务器
│   │   ├── ws-server.ts     # WebSocket 消息处理
│   │   └── types/           # 协议类型定义
│   └── dist/                # 编译输出
│
├── pro-api-sdk/             # 浏览器扩展
│   ├── src/
│   │   ├── index.ts         # 扩展入口
│   │   ├── websocket-client.ts  # WebSocket 客户端
│   │   ├── sch-api-adapter.ts   # 原理图 API 适配器
│   │   └── protocol.ts      # 协议类型定义
│   └── dist/
│       └── pro-api-sdk_v1.0.0.eext
```

**文件命名规范**

- TypeScript 文件：`camelCase.ts` 或 `kebab-case.ts`
- 类名：`PascalCase`
- 接口/类型：`PascalCase` (带 I 前缀或无需前缀)

## 常用命令

**MCP 服务器开发**

```bash
cd packages/jlceda-pcb-mcp
npm run build      # tsc 编译
npm run dev        # tsc --watch 监听模式
npm start          # node dist/index.js 运行
```

**浏览器扩展开发**

```bash
# 构建后手动导入到 JLCEDA Pro
# 菜单 → WebSocket 桥接器 → 初始化/连接
```

## 代码规范

**MUST (必须遵守)**

- MUST TypeScript 严格模式（已启用）
- MUST 使用全局 `eda` 对象（不导入、不实例化）
- MUST 使用 `globalThis` 管理扩展全局状态

**API 调用规范**

```typescript
// ✅ 正确：直接使用全局 eda 对象
eda.sch_PrimitiveComponent.getAll()
eda.sys_WebSocket.register(...)
await eda.sch_Netlist.getNetlist()

// ❌ 错误：不要使用 new 或 import
const ws = new eda.SYS_WebSocket()  // 错误
import { eda } from '...'           // 错误
```

**全局状态管理**

```typescript
// ✅ 正确：使用 globalThis 创建真正全局对象
declare global {
  var _jlcedaWebSocketBridge: {
    connectionManager?: ConnectionManager;
  } | undefined;
}

const globalState = globalThis._jlcedaWebSocketBridge ||= {};
```

**WebSocket 协议**

- 请求格式：`{id, method, params}`
- 响应格式：`{id, result?, error?}`
- 方法命名：`domain.action` (如 `sch.get_component`)

**MCP 工具注册模式**

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'sch_get_component': {
      // 1. 参数验证
      if (!args?.designator) {
        return { content: [{ type: 'text', text: '错误：缺少参数' }], isError: true };
      }

      // 2. 调用 WebSocket 服务器
      const result = await wsServer.sendRequest('sch.get_component', args);

      // 3. 返回格式化结果
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  }
});
```

## 编程指导资料

**官方资源**

- [嘉立创EDA 扩展 API 文档](https://prodocs.lceda.cn/cn/api/guide/)
- [SYS_WebSocket 参考](https://prodocs.lceda.cn/cn/api/reference/pro-api.sys_websocket.html)
- [SCH_PrimitiveComponent API](https://prodocs.lceda.cn/cn/api/reference/pro-api.sch_primitivecomponent.html)

## 工作流和限制

**❌ 限制事项**

- ���要修改 `packages/pro-api-sdk/node_modules/@jlceda/pro-api-types` (官方类型定义)
- 不要更改 WebSocket 端口 8765 (已硬编码)
- 不要在生产环境使用 Bun 运时 (仅开发使用)

**⚠️ 已知有BUG的API**

以下API存在官方BUG，不建议使用：

- `eda.sch_Netlist.getNetlist()` - **存在BUG，请勿使用**
  - 问题描述：API调用不稳定，可能导致获取网表失败

**✅ 可自由修改**

- `packages/jlceda-pcb-mcp/src/` - MCP 服务器逻辑
- `packages/pro-api-sdk/src/` - 扩展业务逻辑

**开发流程**

1. 修改源代码后运行 `npm run build` 编译
2. 浏览器扩展：重新加载扩展

## 故障排除

**端口占用**：`packages/jlceda-pcb-mcp/src/utils/port-manager.ts` 自动释放端口 8765
**连接失败**：确认 MCP 服务器已启动，查看 JLCEDA Pro 控制台（F12）
**API 调用错误**：检查参数格式，查看扩展控制台日志
