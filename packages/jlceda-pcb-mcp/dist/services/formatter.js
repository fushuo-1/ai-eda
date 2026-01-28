/**
 * Response formatting utilities
 */
import { ResponseFormat } from '../schemas/common.js';
import { DEFAULT_CHARACTER_LIMIT } from '../constants.js';
/**
 * Format response based on requested format
 * @param data - Structured data to format
 * @param format - Response format (markdown or json)
 * @param markdownFormatter - Function to format data as markdown
 * @returns Object with text content and optional structured data
 */
export function formatResponse(data, format, markdownFormatter) {
    if (format === ResponseFormat.JSON) {
        return {
            text: JSON.stringify(data, null, 2),
            structured: data,
        };
    }
    return {
        text: markdownFormatter(data),
        structured: data,
    };
}
/**
 * Truncate response if it exceeds character limit
 * @param text - Text to truncate
 * @param limit - Character limit
 * @param item - Item name for truncation message
 * @returns Truncated text with warning message if needed
 */
export function truncateResponse(text, limit = DEFAULT_CHARACTER_LIMIT, item = 'items') {
    if (text.length <= limit)
        return text;
    const truncatedText = text.slice(0, Math.max(100, Math.floor(limit / 2)));
    return `${truncatedText}\n\n⚠️ Response truncated. Use pagination parameters or add filters to see more ${item}.`;
}
/**
 * Format board outline size as markdown
 */
export function formatBoardOutlineMarkdown(outline) {
    let output = '✅ PCB Board Outline Size:\n\n';
    output += `┌─────────────────────────────────────┐\n`;
    output += `│ Width: ${outline.widthMM.toFixed(3)} mm (${outline.widthMil.toFixed(1)} mil)\n`;
    output += `│ Height: ${outline.heightMM.toFixed(3)} mm (${outline.heightMil.toFixed(1)} mil)\n`;
    output += `├─────────────────────────────────────┤\n`;
    output += `│ Imperial: ${outline.widthInch.toFixed(4)}" × ${outline.heightInch.toFixed(4)}"\n`;
    output += `└─────────────────────────────────────┘\n\n`;
    output += `📊 Details:\n`;
    output += `- Layer: Layer ${outline.layer} (Board Outline)\n`;
    output += `- Primitive ID: ${outline.primitiveId}\n`;
    output += `- Outline count: ${outline.outlineCount}\n`;
    return output;
}
/**
 * Format PCB components list as markdown
 */
export function formatPCBComponentsMarkdown(result) {
    const components = result.components || [];
    const stats = result.stats;
    let output = '✅ PCB Components List:\n\n';
    if (stats) {
        output += `📊 Statistics:\n`;
        output += `- Total: ${stats.total} components\n`;
        output += `- Top layer (TOP): ${stats.topLayer} components\n`;
        output += `- Bottom layer (BOTTOM): ${stats.bottomLayer} components\n\n`;
    }
    else {
        output += `Found ${result.count || components.length} components\n\n`;
    }
    if (components.length > 0) {
        output += `Components:\n`;
        components.forEach((c, idx) => {
            output += `${idx + 1}. ${c.designator} (${c.layerName || `Layer ${c.layer}`})\n`;
            output += `   - Primitive ID: ${c.primitiveId}\n`;
            output += `   - Position: (${c.x.toFixed(2)}, ${c.y.toFixed(2)}) mil\n`;
            output += `   - Rotation: ${c.rotation}°\n`;
        });
    }
    return output;
}
/**
 * Format schematic component as markdown
 */
export function formatSchematicComponentMarkdown(component) {
    const c = component;
    let output = `Component Information:\n`;
    output += `- Designator: ${c.designator}\n`;
    output += `- Primitive ID: ${c.primitiveId}\n`;
    output += `- Name: ${c.name}\n`;
    output += `- Type: ${c.type}\n`;
    output += `- Position: (${c.position.x}, ${c.position.y})\n`;
    output += `- Rotation: ${c.rotation}°\n`;
    output += `- Mirrored: ${c.mirror ? 'Yes' : 'No'}\n`;
    if (c.manufacturer)
        output += `- Manufacturer: ${c.manufacturer}\n`;
    if (c.supplierId)
        output += `- Supplier ID: ${c.supplierId}\n`;
    return output;
}
/**
 * Format PCB layer count as markdown
 */
export function formatLayerCountMarkdown(result) {
    const layerCount = result.layerCount;
    let output = '✅ PCB Layer Count:\n\n';
    if (layerCount) {
        output += `📊 Copper Layers:\n`;
        output += `  Top Layer (TOP): ${layerCount.topLayer ? '✓' : '✗'}\n`;
        output += `  Bottom Layer (BOTTOM): ${layerCount.bottomLayer ? '✓' : '✗'}\n`;
        output += `  Inner Layers: ${layerCount.innerLayerCount}\n`;
        output += `  ──────────────────────\n`;
        output += `  **Total: ${layerCount.copperLayerCount} Layers**\n\n`;
        output += `📈 Statistics:\n`;
        output += `- All layer definitions: ${layerCount.allLayersCount}\n`;
        output += `- Enabled layers: ${layerCount.enabledLayersCount}\n`;
    }
    else {
        output += 'No layer count data available\n';
    }
    return output;
}
/**
 * Format component relative position as markdown
 */
export function formatComponentRelativePositionMarkdown(result, preferredUnit = 'mm') {
    const c1 = result.component1;
    const c2 = result.component2;
    const rel = result.relativePosition;
    const sameLayer = result.sameLayer;
    if (!result.success) {
        return `❌ 计算失败: ${result.error}`;
    }
    let output = '✅ PCB元器件相对位置:\n\n';
    // 元器件1信息
    output += `📍 元器件1: **${c1.designator}**\n`;
    output += `   - 层级: Layer ${c1.layer} (${c1.layer === 1 ? 'TOP' : c1.layer === 2 ? 'BOTTOM' : 'Other'})\n`;
    output += `   - 位置: (${c1.x.toFixed(2)}, ${c1.y.toFixed(2)}) mil\n`;
    output += `   - 旋转: ${c1.rotation}°\n\n`;
    // 元器件2信息
    output += `📍 元器件2: **${c2.designator}**\n`;
    output += `   - 层级: Layer ${c2.layer} (${c2.layer === 1 ? 'TOP' : c2.layer === 2 ? 'BOTTOM' : 'Other'})\n`;
    output += `   - 位置: (${c2.x.toFixed(2)}, ${c2.y.toFixed(2)}) mil\n`;
    output += `   - 旋转: ${c2.rotation}°\n\n`;
    // 相对位置信息
    output += `📐 相对位置（从${c1.designator}指向${c2.designator}）:\n`;
    output += `┌─────────────────────────────────────┐\n`;
    // 根据首选单位显示距离
    if (preferredUnit === 'mm') {
        output += `│ 距离: ${rel.distanceMM.toFixed(3)} mm (${rel.distanceMil.toFixed(1)} mil)\n`;
    }
    else if (preferredUnit === 'mil') {
        output += `│ 距离: ${rel.distanceMil.toFixed(1)} mil (${rel.distanceMM.toFixed(3)} mm)\n`;
    }
    else {
        output += `│ 距离: ${rel.distanceInch.toFixed(4)}" (${rel.distanceMM.toFixed(3)} mm)\n`;
    }
    output += `├─────────────────────────────────────┤\n`;
    output += `│ 角度: ${rel.angleDegrees.toFixed(1)}° (${rel.angleRadians.toFixed(3)} rad)\n`;
    output += `│ 方位: ${rel.cardinalDirection}${rel.detailedDirection !== rel.cardinalDirection ? ` (${rel.detailedDirection})` : ''}\n`;
    output += `└─────────────────────────────────────┘\n\n`;
    // 层级信息
    output += `📊 层级信息:\n`;
    output += `- 是否在同一层: ${sameLayer ? '✓ 是' : '✗ 否'}\n`;
    if (!sameLayer) {
        output += `  ⚠️  注意：两个元器件位于不同层级，实际布局需考虑板厚和通孔\n`;
    }
    return output;
}
/**
 * Format nearby components as markdown
 */
export function formatNearbyComponentsMarkdown(result, preferredUnit = 'mil') {
    if (!result.success) {
        return `❌ 查询失败: ${result.error}`;
    }
    const ref = result.reference;
    const nearby = result.nearbyComponents || [];
    const stats = result.statistics;
    const warnings = result.warnings || [];
    let output = '✅ 邻近器件查询结果:\n\n';
    // 参考器件信息
    output += `📍 参考器件: **${ref.designator}**\n`;
    output += `   - 位置: (${ref.position.x.toFixed(2)}, ${ref.position.y.toFixed(2)}) mil\n`;
    output += `   - 层级: Layer ${ref.layer} (${ref.layer === 1 ? 'TOP' : ref.layer === 2 ? 'BOTTOM' : 'Other'})\n\n`;
    // 统计信息
    if (stats) {
        output += `📊 统计信息:\n`;
        output += `   - 找到器件: ${stats.totalFound} 个\n`;
        output += `   - 遍历器件: ${stats.searched} 个\n`;
        if (stats.executionTime) {
            output += `   - 执行时间: ${stats.executionTime} ms\n`;
        }
        if (stats.density !== undefined) {
            output += `   - 区域密度: ${stats.density.toFixed(4)} 器件/mil²\n`;
        }
        output += '\n';
    }
    // DFM 警告
    if (warnings.length > 0) {
        output += `⚠️  DFM 警告:\n`;
        warnings.forEach((warning, idx) => {
            const icon = warning.severity === 'error' ? '❌' : '⚠️';
            output += `   ${idx + 1}. ${icon} ${warning.message}\n`;
        });
        output += '\n';
    }
    // 邻近器件列表
    if (nearby.length === 0) {
        output += `🔍 未找到符合条件的器件\n`;
    }
    else {
        output += `🔍 邻近器件列表:\n\n`;
        // 表头
        output += `│ 序号 │ 器件 │ 层级 │ 距离 │ 角度 │ 方向 │ 重叠 │\n`;
        output += `│──────│──────│──────│──────│──────│──────│──────│\n`;
        nearby.forEach((comp, idx) => {
            const no = idx + 1;
            const designator = comp.designator.padEnd(4);
            const layer = comp.layer === 1 ? 'TOP' : comp.layer === 2 ? 'BTM' : `L${comp.layer}`;
            const layerStr = layer.padEnd(4);
            // 根据首选单位显示距离
            let distanceStr;
            if (preferredUnit === 'mm') {
                distanceStr = `${comp.distance.mm.toFixed(2)}mm`.padEnd(6);
            }
            else if (preferredUnit === 'inch') {
                distanceStr = `${comp.distance.inch.toFixed(3)}"`.padEnd(6);
            }
            else {
                distanceStr = `${comp.distance.mil.toFixed(1)}m`.padEnd(6);
            }
            const angleStr = `${comp.angle.toFixed(1)}°`.padEnd(6);
            const dirStr = comp.direction.padEnd(4);
            const overlapStr = comp.overlapping ? '❌' : '✓';
            output += `│ ${no.toString().padEnd(4)} │ ${designator} │ ${layerStr} │ ${distanceStr} │ ${angleStr} │ ${dirStr} │ ${overlapStr} │\n`;
        });
        output += '\n';
        // 详细信息（仅前5个）
        const detailCount = Math.min(5, nearby.length);
        if (detailCount > 0) {
            output += `📋 详细信息（前${detailCount}个）:\n\n`;
            nearby.slice(0, detailCount).forEach((comp, idx) => {
                output += `${idx + 1}. **${comp.designator}**\n`;
                output += `   - 位置: (${comp.position.x.toFixed(2)}, ${comp.position.y.toFixed(2)}) mil\n`;
                output += `   - 层级: Layer ${comp.layer}\n`;
                output += `   - 旋转: ${comp.rotation}°\n`;
                output += `   - 距离: ${comp.distance.mil.toFixed(2)} mil (${comp.distance.mm.toFixed(3)} mm, ${comp.distance.inch.toFixed(4)}")\n`;
                output += `   - 角度: ${comp.angle.toFixed(2)}°\n`;
                output += `   - 方向: ${comp.direction} (${comp.detailedDirection})\n`;
                if (comp.overlapping) {
                    output += `   - ⚠️  **重叠**: 是（边界盒相交）\n`;
                }
                else {
                    output += `   - ✓ **重叠**: 否\n`;
                }
                // 可选：显示边界盒信息
                if (comp.boundingBox) {
                    const bbox = comp.boundingBox;
                    output += `   - 📦 边界盒: ${bbox.width.toFixed(1)}×${bbox.height.toFixed(1)}mil `;
                    output += `@[${bbox.minX.toFixed(1)}, ${bbox.minY.toFixed(1)}]\n`;
                }
                output += '\n';
            });
            if (nearby.length > detailCount) {
                output += `... 还有 ${nearby.length - detailCount} 个器件未显示\n\n`;
            }
        }
    }
    return output;
}
/**
 * Format component bounding box as markdown
 */
export function formatComponentBoundingBoxMarkdown(bbox, preferredUnit = 'mm') {
    if (!bbox) {
        return '❌ 边界盒计算失败';
    }
    const comp = bbox.component;
    const details = bbox.calculationDetails;
    let output = '✅ PCB元器件封装边界盒:\n\n';
    // 元器件基本信息
    output += `📍 元器件: **${comp.designator}**\n`;
    output += `   - Primitive ID: ${comp.primitiveId}\n`;
    output += `   - 层级: Layer ${comp.layer} (${comp.layer === 1 ? 'TOP' : comp.layer === 2 ? 'BOTTOM' : 'Other'})\n`;
    output += `   - 位置: (${comp.x.toFixed(2)}, ${comp.y.toFixed(2)}) mil\n`;
    output += `   - 旋转: ${comp.rotation}°\n\n`;
    // 1. 原始封装尺寸（未旋转）
    output += `📦 原始封装尺寸（未考虑元器件旋转）:\n`;
    output += `┌─────────────────────────────────────┐\n`;
    if (preferredUnit === 'mm') {
        output += `│ 宽度: ${bbox.dimensions.unrotated.widthMM.toFixed(3)} mm (${bbox.dimensions.unrotated.widthMil.toFixed(1)} mil)\n`;
        output += `│ 高度: ${bbox.dimensions.unrotated.heightMM.toFixed(3)} mm (${bbox.dimensions.unrotated.heightMil.toFixed(1)} mil)\n`;
    }
    else if (preferredUnit === 'mil') {
        output += `│ 宽度: ${bbox.dimensions.unrotated.widthMil.toFixed(1)} mil (${bbox.dimensions.unrotated.widthMM.toFixed(3)} mm)\n`;
        output += `│ 高度: ${bbox.dimensions.unrotated.heightMil.toFixed(1)} mil (${bbox.dimensions.unrotated.heightMM.toFixed(3)} mm)\n`;
    }
    else {
        output += `│ 宽度: ${bbox.dimensions.unrotated.widthInch.toFixed(4)}" (${bbox.dimensions.unrotated.widthMM.toFixed(3)} mm)\n`;
        output += `│ 高度: ${bbox.dimensions.unrotated.heightInch.toFixed(4)}" (${bbox.dimensions.unrotated.heightMM.toFixed(3)} mm)\n`;
    }
    output += `├─────────────────────────────────────┤\n`;
    output += `│ 中心点: (${bbox.unrotated.centerX.toFixed(2)}, ${bbox.unrotated.centerY.toFixed(2)}) mil\n`;
    output += `└─────────────────────────────────────┘\n\n`;
    // 2. 旋转后占用尺寸（原"原始边界盒"）
    output += `🔄 旋转后占用尺寸（考虑 ${comp.rotation}° 旋转，不含安全裕量）:\n`;
    output += `┌─────────────────────────────────────┐\n`;
    if (preferredUnit === 'mm') {
        output += `│ 宽度: ${bbox.dimensions.raw.widthMM.toFixed(3)} mm (${bbox.dimensions.raw.widthMil.toFixed(1)} mil)\n`;
        output += `│ 高度: ${bbox.dimensions.raw.heightMM.toFixed(3)} mm (${bbox.dimensions.raw.heightMil.toFixed(1)} mil)\n`;
    }
    else if (preferredUnit === 'mil') {
        output += `│ 宽度: ${bbox.dimensions.raw.widthMil.toFixed(1)} mil (${bbox.dimensions.raw.widthMM.toFixed(3)} mm)\n`;
        output += `│ 高度: ${bbox.dimensions.raw.heightMil.toFixed(1)} mil (${bbox.dimensions.raw.heightMM.toFixed(3)} mm)\n`;
    }
    else {
        output += `│ 宽度: ${bbox.dimensions.raw.widthInch.toFixed(4)}" (${bbox.dimensions.raw.widthMM.toFixed(3)} mm)\n`;
        output += `│ 高度: ${bbox.dimensions.raw.heightInch.toFixed(4)}" (${bbox.dimensions.raw.heightMM.toFixed(3)} mm)\n`;
    }
    output += `├─────────────────────────────────────┤\n`;
    output += `│ 左下角: (${bbox.raw.minX.toFixed(2)}, ${bbox.raw.minY.toFixed(2)}) mil\n`;
    output += `│ 右上角: (${bbox.raw.maxX.toFixed(2)}, ${bbox.raw.maxY.toFixed(2)}) mil\n`;
    output += `│ 中心点: (${bbox.raw.centerX.toFixed(2)}, ${bbox.raw.centerY.toFixed(2)}) mil\n`;
    output += `└─────────────────────────────────────┘\n\n`;
    // 3. 实际边界盒（含安全裕量）
    output += `🛡️  实际边界盒（含安全裕量 ${details.safetyMarginMil.toFixed(1)} mil ≈ ${details.safetyMarginMM.toFixed(2)} mm）:\n`;
    output += `┌─────────────────────────────────────┐\n`;
    if (preferredUnit === 'mm') {
        output += `│ 宽度: ${bbox.dimensions.actual.widthMM.toFixed(3)} mm (${bbox.dimensions.actual.widthMil.toFixed(1)} mil)\n`;
        output += `│ 高度: ${bbox.dimensions.actual.heightMM.toFixed(3)} mm (${bbox.dimensions.actual.heightMil.toFixed(1)} mil)\n`;
    }
    else if (preferredUnit === 'mil') {
        output += `│ 宽度: ${bbox.dimensions.actual.widthMil.toFixed(1)} mil (${bbox.dimensions.actual.widthMM.toFixed(3)} mm)\n`;
        output += `│ 高度: ${bbox.dimensions.actual.heightMil.toFixed(1)} mil (${bbox.dimensions.actual.heightMM.toFixed(3)} mm)\n`;
    }
    else {
        output += `│ 宽度: ${bbox.dimensions.actual.widthInch.toFixed(4)}" (${bbox.dimensions.actual.widthMM.toFixed(3)} mm)\n`;
        output += `│ 高度: ${bbox.dimensions.actual.heightInch.toFixed(4)}" (${bbox.dimensions.actual.heightMM.toFixed(3)} mm)\n`;
    }
    output += `├─────────────────────────────────────┤\n`;
    output += `│ 左下角: (${bbox.actual.minX.toFixed(2)}, ${bbox.actual.minY.toFixed(2)}) mil\n`;
    output += `│ 右上角: (${bbox.actual.maxX.toFixed(2)}, ${bbox.actual.maxY.toFixed(2)}) mil\n`;
    output += `│ 中心点: (${bbox.actual.centerX.toFixed(2)}, ${bbox.actual.centerY.toFixed(2)}) mil\n`;
    output += `└─────────────────────────────────────┘\n\n`;
    // 计算详情
    output += `📊 计算详情:\n`;
    output += `- 焊盘数量: ${details.padCount}\n`;
    output += `- 安全裕量: ${details.safetyMarginMil.toFixed(1)} mil (${details.safetyMarginMM.toFixed(2)} mm)\n`;
    output += `- 执行时间: ${details.executionTimeMs} ms\n`;
    // 警告信息
    if (details.warnings && details.warnings.length > 0) {
        output += `\n⚠️  警告:\n`;
        details.warnings.forEach((warning, idx) => {
            output += `  ${idx + 1}. ${warning}\n`;
        });
    }
    // DFM 建议
    output += `\n💡 DFM 建议:\n`;
    const clearanceMM = bbox.dimensions.actual.widthMM * 0.2; // 建议间距为封装尺寸的20%
    output += `- 建议与其他元器件保持至少 ${clearanceMM.toFixed(2)} mm 的间距\n`;
    output += `- 如果是高密度布局，建议减小安全裕量至 ${Math.max(20, details.safetyMarginMil - 20).toFixed(0)} mil\n`;
    output += `- 如果是手工焊接，建议增大安全裕量至 ${(details.safetyMarginMil + 30).toFixed(0)} mil\n`;
    return output;
}
/**
 * Format collision check result as markdown
 */
export function formatCollisionCheckMarkdown(result, preferredUnit = 'mil') {
    if (!result.success) {
        return `❌ 碰撞检测失败\n\n错误: ${result.warnings?.[0]?.message || '未知错误'}`;
    }
    let output = '🔍 PCB器件碰撞检测报告\n\n';
    // 参考器件信息
    const ref = result.reference;
    output += `📍 参考器件: **${ref.designator}**\n`;
    output += `   - 位置: (${ref.position.x.toFixed(2)}, ${ref.position.y.toFixed(2)}) mil\n`;
    output += `   - 层级: Layer ${ref.layer}\n`;
    if (ref.boundingBox) {
        output += `   - 边界盒: ${ref.boundingBox.raw.width.toFixed(1)}×${ref.boundingBox.raw.height.toFixed(1)} mil\n`;
    }
    output += '\n';
    // 统计信息
    const stats = result.statistics;
    output += `📊 统计信息:\n`;
    output += `   - 检查器件总数: ${stats.totalChecked}\n`;
    output += `   - 发现违规: ${stats.violationsFound}\n`;
    if (stats.spacingViolations > 0) {
        output += `   - 间距违规: ${stats.spacingViolations}\n`;
    }
    if (stats.overlapViolations > 0) {
        output += `   - 重叠违规: ${stats.overlapViolations}\n`;
    }
    output += `   - 执行时间: ${stats.executionTimeMs} ms\n\n`;
    // 违规详情
    if (result.violations && result.violations.length > 0) {
        output += `⚠️  违规器件详情:\n\n`;
        result.violations.forEach((violation, idx) => {
            output += `${idx + 1}. **${violation.designator}**\n`;
            // 违规类型
            const typeLabels = {
                spacing: '间距违规',
                overlap: '重叠违规',
                both: '间距+重叠'
            };
            output += `   - 类型: ${typeLabels[violation.violationType]}\n`;
            // 距离信息
            const distance = violation.distance;
            if (preferredUnit === 'mm') {
                output += `   - 距离: ${distance.mm.toFixed(3)} mm (${distance.mil.toFixed(1)} mil)\n`;
            }
            else if (preferredUnit === 'inch') {
                output += `   - 距离: ${distance.inch.toFixed(4)}" (${distance.mm.toFixed(3)} mm)\n`;
            }
            else {
                output += `   - 距离: ${distance.mil.toFixed(1)} mil (${distance.mm.toFixed(3)} mm)\n`;
            }
            output += `   - 方向: ${violation.direction} (${violation.angle.toFixed(1)}°)\n`;
            // 间距违规详情
            if (violation.spacing) {
                const sp = violation.spacing;
                output += `   - ⚠️  间距违规:\n`;
                output += `     - 实际: ${sp.actual.toFixed(2)} ${sp.unit}\n`;
                output += `     - 要求: ${sp.required.toFixed(2)} ${sp.unit}\n`;
                output += `     - 不足: ${sp.deficit.toFixed(2)} ${sp.unit}\n`;
            }
            // 重叠违规详情
            if (violation.overlap) {
                const ov = violation.overlap;
                output += `   - ❌ 重叠违规:\n`;
                output += `     - 重叠面积: ${ov.area ? ov.area.toFixed(0) : 'N/A'} mil²\n`;
                if (ov.boundingBox) {
                    output += `     - 边界盒: ${ov.boundingBox.width.toFixed(1)}×${ov.boundingBox.height.toFixed(1)} mil\n`;
                }
            }
            output += '\n';
        });
    }
    else {
        output += `✅ 未发现违规\n\n`;
    }
    // DFM 警告
    if (result.warnings && result.warnings.length > 0) {
        output += `🚨 DFM 警告:\n\n`;
        result.warnings.forEach((warning, idx) => {
            const icon = warning.severity === 'error' ? '❌' : warning.severity === 'warning' ? '⚠️' : 'ℹ️';
            output += `${idx + 1}. ${icon} ${warning.message}\n`;
        });
        output += '\n';
    }
    return output;
}
/**
 * Format overlap check result as markdown (specialized for overlap detection)
 */
export function formatOverlapCheckMarkdown(result) {
    if (!result.success) {
        return `❌ 重叠检测失败\n\n错误: ${result.warnings?.[0]?.message || '未知错误'}`;
    }
    let output = '🔍 PCB器件重叠检测报告\n\n';
    // 参考器件信息
    const ref = result.reference;
    output += `📍 参考器件: **${ref.designator}**\n`;
    output += `   - 位置: (${ref.position.x.toFixed(2)}, ${ref.position.y.toFixed(2)}) mil\n`;
    output += `   - 层级: Layer ${ref.layer}\n`;
    if (ref.boundingBox) {
        output += `   - 边界盒: ${ref.boundingBox.raw.width.toFixed(1)}×${ref.boundingBox.raw.height.toFixed(1)} mil\n`;
    }
    output += '\n';
    // 统计信息
    const stats = result.statistics;
    output += `📊 统计信息:\n`;
    output += `   - 检查器件总数: ${stats.totalChecked}\n`;
    output += `   - 发现重叠: ${stats.overlapViolations}\n`;
    output += `   - 执行时间: ${stats.executionTimeMs} ms\n\n`;
    // 过滤出重叠违规
    const overlapViolations = result.violations?.filter((v) => v.violationType === 'overlap' || v.violationType === 'both') || [];
    // 重叠详情
    if (overlapViolations.length > 0) {
        output += `⚠️  重叠器件详情:\n\n`;
        overlapViolations.forEach((violation, idx) => {
            output += `${idx + 1}. **${violation.designator}**\n`;
            output += `   - 距离: ${violation.distance.mil.toFixed(1)} mil (${violation.distance.mm.toFixed(3)} mm)\n`;
            output += `   - 方向: ${violation.direction} (${violation.angle.toFixed(1)}°)\n`;
            // 重叠违规详情
            if (violation.overlap) {
                const ov = violation.overlap;
                output += `   - ❌ 重叠违规:\n`;
                output += `     - 重叠面积: ${ov.area ? ov.area.toFixed(0) : 'N/A'} mil²\n`;
                if (ov.boundingBox) {
                    output += `     - 边界盒: ${ov.boundingBox.width.toFixed(1)}×${ov.boundingBox.height.toFixed(1)} mil\n`;
                }
            }
            output += '\n';
        });
    }
    else {
        output += `✅ 未发现重叠\n\n`;
    }
    // DFM 警告
    if (result.warnings && result.warnings.length > 0) {
        output += `🚨 DFM 警告:\n\n`;
        result.warnings.forEach((warning, idx) => {
            const icon = warning.severity === 'error' ? '❌' : warning.severity === 'warning' ? '⚠️' : 'ℹ️';
            output += `${idx + 1}. ${icon} ${warning.message}\n`;
        });
        output += '\n';
    }
    return output;
}
/**
 * Format spacing check result as markdown (specialized for spacing detection)
 */
export function formatSpacingCheckMarkdown(result, preferredUnit = 'mil') {
    if (!result.success) {
        return `❌ 间距检测失败\n\n错误: ${result.warnings?.[0]?.message || '未知错误'}`;
    }
    let output = '🔍 PCB器件间距检测报告\n\n';
    // 参考器件信息
    const ref = result.reference;
    output += `📍 参考器件: **${ref.designator}**\n`;
    output += `   - 位置: (${ref.position.x.toFixed(2)}, ${ref.position.y.toFixed(2)}) mil\n`;
    output += `   - 层级: Layer ${ref.layer}\n`;
    if (ref.boundingBox) {
        output += `   - 边界盒: ${ref.boundingBox.raw.width.toFixed(1)}×${ref.boundingBox.raw.height.toFixed(1)} mil\n`;
    }
    output += '\n';
    // 统计信息
    const stats = result.statistics;
    output += `📊 统计信息:\n`;
    output += `   - 检查器件总数: ${stats.totalChecked}\n`;
    output += `   - 间距违规: ${stats.spacingViolations}\n`;
    output += `   - 执行时间: ${stats.executionTimeMs} ms\n\n`;
    // 过滤出间距违规
    const spacingViolations = result.violations?.filter((v) => v.violationType === 'spacing' || v.violationType === 'both') || [];
    // 间距违规详情
    if (spacingViolations.length > 0) {
        output += `⚠️  间距违规器件详情:\n\n`;
        spacingViolations.forEach((violation, idx) => {
            output += `${idx + 1}. **${violation.designator}**\n`;
            // 距离信息
            const distance = violation.distance;
            if (preferredUnit === 'mm') {
                output += `   - 距离: ${distance.mm.toFixed(3)} mm (${distance.mil.toFixed(1)} mil)\n`;
            }
            else if (preferredUnit === 'inch') {
                output += `   - 距离: ${distance.inch.toFixed(4)}" (${distance.mm.toFixed(3)} mm)\n`;
            }
            else {
                output += `   - 距离: ${distance.mil.toFixed(1)} mil (${distance.mm.toFixed(3)} mm)\n`;
            }
            output += `   - 方向: ${violation.direction} (${violation.angle.toFixed(1)}°)\n`;
            // 间距违规详情
            if (violation.spacing) {
                const sp = violation.spacing;
                output += `   - ⚠️  间距违规:\n`;
                output += `     - 实际: ${sp.actual.toFixed(2)} ${sp.unit}\n`;
                output += `     - 要求: ${sp.required.toFixed(2)} ${sp.unit}\n`;
                output += `     - 不足: ${sp.deficit.toFixed(2)} ${sp.unit}\n`;
            }
            output += '\n';
        });
    }
    else {
        output += `✅ 间距符合要求\n\n`;
    }
    // DFM 警告
    if (result.warnings && result.warnings.length > 0) {
        output += `🚨 DFM 警告:\n\n`;
        result.warnings.forEach((warning, idx) => {
            const icon = warning.severity === 'error' ? '❌' : warning.severity === 'warning' ? '⚠️' : 'ℹ️';
            output += `${idx + 1}. ${icon} ${warning.message}\n`;
        });
        output += '\n';
    }
    return output;
}
//# sourceMappingURL=formatter.js.map