# JLCEDA PCB MCP 服务器

MCP (Model Context Protocol) 服务器，使 Claude AI 能够通过 WebSocket 桥接扩展与嘉立创EDA Pro 进行交互。提供原理图和PCB分析、元件定位和DFM感知的设计反馈。

## 架构

```
Claude Code → MCP 服务器 (端口 8765) → WebSocket → 浏览器扩展 → 嘉立创EDA Pro API
```

**数据流向:**
1. Claude Code 调用 MCP 工具
2. MCP 服务器向浏览器扩展发送 WebSocket 请求
3. 扩展调用嘉立创EDA Pro 的原生 API
4. 结果沿链路返回

## 功能特性

- **22 个 MCP 工具**，覆盖原理图和PCB操作
- **原理图分析** (5个工具) - 元件检查、引脚映射
- **PCB 信息** (9个工具) - 板尺寸、层数、元件数据
- **DFM 分析** (7个工具) - 间距检查、碰撞检测、邻近元件搜索
- **有限的写入操作** (1个工具) - 元件移动/旋转
- **工程反馈** - 安全裕量计算和 DFM 警告

## 前置要求

- **嘉立创EDA Pro** 已安装 WebSocket Bridge 扩展
- **Node.js 18+** (推荐 20+)
- **扩展配置** - WebSocket 服务器运行在端口 8765

## 安装

```bash
cd packages/jlceda-pcb-mcp
npm install
npm run build
```

## Claude Code 配置

在 `.mcp.json` 或 Claude Code MCP 配置中添加:

```json
{
  "mcpServers": {
    "jlceda-pcb": {
      "command": "node",
      "args": ["D:/OneDrive/ai-eda/packages/jlceda-pcb-mcp/dist/index.js"],
      "env": {
        "JLCEDA_WS_URL": "ws://localhost:8765"
      }
    }
  }
}
```

## 扩展设置

1. 打开嘉立创EDA Pro
2. 安装 WebSocket Bridge 扩展 (`pro-api-sdk/dist/pro-api-sdk_v1.0.0.eext`)
3. 菜单 → WebSocket Bridge → 初始化
4. 确认端口 8765 连接成功

---

## 工具参考

### 原理图工具 (5个)

| 工具 | 描述 | 参数 |
|------|-------------|------------|
| `sch_get_all_components` | 获取原理图中的所有元件 | `componentType?`, `allSchematicPages?` |
| `sch_get_component_by_designator` | 通过位号获取特定元件 | `designator` (必需) |
| `sch_get_component_pins` | 获取元件引脚和网络连接 | `primitiveId` (必需) |

### PCB 工具 - 信息类 (9个)

| 工具 | 描述 | 参数 |
|------|-------------|------------|
| `pcb_get_board_outline_size` | 获取PCB尺寸 (mm/mil/inch) | `unit?` |
| `pcb_get_board_outline_position` | 获取板边框和顶点坐标 | - |
| `pcb_get_all_components` | 获取所有PCB元件及层分布统计 | - |
| `pcb_get_top_layer_components` | 仅获取顶层元件 | - |
| `pcb_get_bottom_layer_components` | 仅获取底层元件 | - |
| `pcb_find_component_by_designator` | 通过位号查找元件 | `designator` (必需) |
| `pcb_get_component_pads` | 获取元件焊盘位置 | `primitiveId` (必需) |
| `pcb_get_layer_count` | 获取层数和启用的层 | - |
| `pcb_generate_netlist_map` | 生成引脚到网络的映射 | `maxNetworks?`, `maxComponents?`, `maxPinsPerNet?` |

### PCB 工具 - 分析与 DFM (7个)

| 工具 | 描述 | 参数 |
|------|-------------|------------|
| `pcb_calculate_component_relative_position` | 计算元件间的距离/角度 | `designator1`, `designator2`, `unit?` |
| `pcb_find_nearby_components` | 查找附近元件 (KNN/半径/方向) | `designator`, `searchMode`, `radius?`, `k?`, `direction?` |
| `pcb_calculate_component_bounding_box` | 计算带安全裕量的边框 | `designator`, `safetyMargin?`, `unit?` |
| `pcb_check_component_overlap` | 检查元件重叠 | `referenceDesignator`, `boundingBoxType?`, `layer?` |
| `pcb_check_component_spacing` | 检查间距是否满足最小距离要求 | `referenceDesignator`, `minSpacing`, `unit?`, `layer?` |

### PCB 工具 - 写入操作 (1个)

| 工具 | 描述 | 参数 |
|------|-------------|------------|
| `pcb_set_component_transform` | 移动和/或旋转元件 | `designator`, `x?`, `y?`, `rotation?`, `layer?` |

---

## WebSocket 协议

### 请求格式

```json
{
  "id": "unique-request-id",
  "method": "pcb.get_component_by_designator",
  "params": {
    "designator": "U1"
  }
}
```

### 响应格式 (成功)

```json
{
  "id": "unique-request-id",
  "result": {
    "designator": "U1",
    "footprint": "SOP-8",
    "position": { "x": 1000, "y": 500 },
    "rotation": 0,
    "layer": 1
  }
}
```

### 响应格式 (错误)

```json
{
  "id": "unique-request-id",
  "error": {
    "code": 2001,
    "message": "参数验证失败: designator 是必需参数"
  }
}
```

### 错误码

| 代码 | 类型 | 描述 |
|------|------|-------------|
| 1xxx | 网络 | WebSocket 连接错误 |
| 2xxx | 参数 | 无效或缺失参数 |
| 3xxx | API | 嘉立创EDA Pro API 错误 |
| 4xxx | 业务逻辑 | 操作逻辑错误 |

---

## 使用示例

### 示例 1: 获取PCB尺寸

```
用户: 这块PCB的尺寸是多少？

Claude: [调用 pcb_get_board_outline_size]

PCB板框尺寸为:
- 宽度: 50.8mm (2000 mil)
- 高度: 38.1mm (1500 mil)
- 层: 顶层
```

### 示例 2: 检查元件间距

```
用户: 检查 U1 与附近元件是否保持足够间距

Claude: [调用 pcb_check_component_spacing，设置 minSpacing=10mil]

⚠️ DFM 警告: 检测到间距违规
- U1 到 C1: 5mil (要求: 10mil)
- 建议: 增加间距以满足可制造性标准
```

### 示例 3: 查找附近元件

```
用户: 距离 R1 100mil 范围内有哪些元件？

Claude: [调用 pcb_find_nearby_components，设置 designator=R1, radius=100, searchMode=radius]

在 R1 的 100mil 范围内找到 3 个元件:
- C2 (22pF) - 距离: 45mil, 方向: 东北
- U3 (STM32) - 距离: 78mil, 方向: 北
- R5 (10k) - 距离: 92mil, 方向: 东
```

### 示例 4: 安全移动元件

```
用户: 将 U1 移动到位置 (1500, 1200)

Claude: [调用 pcb_set_component_transform，设置 designator=U1, x=1500, y=1200]

✓ 元件 U1 移动成功
- 新位置: (1500, 1200) mil
- 旋转: 0°
- 层: 顶层
```

---

## 已知限制

### 只读操作
大部分工具为只读操作。只有 `pcb_set_component_transform` 可以修改设计（仅移动/旋转元件）。

### 端口限制
- 端口 **8765** 已硬编码
- 仅Windows支持端口管理（自动终止占用端口8765的进程）
- 同一时间仅支持单个客户端连接


### 坐标系统
- 所有位置默认使用 **mil** (千分之一英寸)，除非另有说明
- 层: `1` = 顶层, `2` = 底层

---

## 故障排除

### "端口 8765 已被占用"

**Windows 解决方案:**
```bash
netstat -ano | findstr :8765
taskkill /F /PID <进程ID>
```

MCP 服务器已内置Windows自动端口管理功能。

### "扩展未连接"

1. 确认嘉立创EDA Pro 已打开
2. 检查扩展已初始化: 菜单 → WebSocket Bridge → 状态
3. 确认MCP服务器正在运行: 检查控制台输出 "WebSocket server listening on port 8765"

### API 调用失败

**检查控制台日志中的错误码:**
- `1xxx` → 网络问题，检查 WebSocket 连接
- `2xxx` → 参数错误，验证工具参数
- `3xxx` → 嘉立创EDA Pro API 错误，检查扩展控制台 (F12)
- `4xxx` → 逻辑错误，检查操作上下文

### 元件查询结果为空

- 确认位号存在 (区分大小写: "U1" 不是 "u1")
- 检查元件是否在正确的层 (顶层 vs 底层)
- 使用 `pcb_get_all_components` 列出所有位号

---

## 开发

```bash
# 监听模式 (修改后自动重新编译)
npm run dev

# 手动编译
npm run build

# 启动服务器
npm start
```

### 项目结构

```
packages/jlceda-pcb-mcp/
├── src/
│   ├── index.ts           # MCP 工具注册
│   ├── ws-server.ts       # WebSocket 服务器
│   ├── tools/             # 工具实现
│   └── types/             # 协议定义
├── dist/                  # 编译输出
└── package.json
```

---

## 许可证

MIT
