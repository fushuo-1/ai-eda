# JLCEDA PCB MCP Server

MCP server for JLCEDA Pro PCB operations via WebSocket bridge extension.

## Architecture

```
Claude Code → MCP Server → WebSocket → JLCEDA Extension → JLCEDA API
```

## Installation

```bash
npm install
npm run build
```

## Usage

The server is automatically started by Claude Code when configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "jlceda-pcb": {
      "command": "node",
      "args": ["/path/to/jlceda-pcb-mcp/dist/index.js"],
      "env": {
        "JLCEDA_WS_URL": "ws://localhost:8765"
      }
    }
  }
}
```

## Requirements

- **JLCEDA Pro** with WebSocket Bridge extension installed
- **Node.js 18+**

## WebSocket Protocol

The server communicates with the JLCEDA extension using JSON-RPC over WebSocket:

**Request:**
```json
{
  "id": "unique-id",
  "method": "pcb.place_component",
  "params": {
    "ref": "U1",
    "footprint": "SOP-8",
    "x": 25.0,
    "y": 20.0
  }
}
```

**Response:**
```json
{
  "id": "unique-id",
  "result": {
    "success": true,
    "component": { ... }
  }
}
```

## Available Tools

### Project Management
- `jlceda_create_project` - Create new project
- `jlceda_open_project` - Open existing project
- `jlceda_save_project` - Save project
- `jlceda_get_project_info` - Get project information

### Component Operations
- `jlceda_place_component` - Place component
- `jlceda_move_component` - Move component
- `jlceda_rotate_component` - Rotate component
- `jlceda_delete_component` - Delete component
- `jlceda_get_component` - Get component info

### Routing
- `jlceda_route_trace` - Route trace
- `jlceda_add_via` - Add via
- `jlceda_delete_trace` - Delete trace

### Layer Management
- `jlceda_set_active_layer` - Set active layer
- `jlceda_get_layer_list` - Get layer list
- `jlceda_add_layer` - Add layer

### DRC
- `jlceda_run_drc` - Run DRC check
- `jlceda_get_drc_report` - Get DRC report
- `jlceda_clear_drc_markers` - Clear DRC markers

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Start server
npm start
```

## License

MIT
