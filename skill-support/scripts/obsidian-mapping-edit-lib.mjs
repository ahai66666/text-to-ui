export const EDIT_QUEUE_START = "<!-- TEXT_TO_UI_MAPPING_EDIT_QUEUE:START -->";
export const EDIT_QUEUE_END = "<!-- TEXT_TO_UI_MAPPING_EDIT_QUEUE:END -->";

const NULL_MARKERS = new Set(["—", "-", "null", "none", "n/a"]);

export function defaultEditQueue() {
  return `${EDIT_QUEUE_START}
## 2. 人工编辑区：待同步变更

只修改下面三张表。每一行代表一次希望同步到 Text-to-UI 的变更。

- \`state=pending\`：下次同步时处理。
- \`state=applied\`：已经同步，不会重复处理；如需再次修改，把它改回 \`pending\`。
- \`action=update\`：修改已有关系；\`action=add\`：新增关系；\`action=unlink\`：解除组件的 Pixso 目标绑定但保留 HTML 组件契约。
- 空白单元格表示保留原值；填写 \`—\` 表示清空该字段。
- Pixso 组件名称必须填写当前 Pixso 文件中的 exact Component Set/COMPONENT name，不能填写 GUID、node ID 或猜测的别名。

### HTML Component ↔ Pixso Component 变更

这是唯一的组件映射入口。\`htmlLogicalName\` 是正式身份；\`runtimeComponentId\` 仅在代码组件库需要用实际 ID 调用时填写（例如 \`icon-text-primary\`），否则留空。它不是另一类组件。

| state | action | profile | htmlLogicalName | runtimeComponentId（可选） | contractId（仅 ID 行） | htmlRendererKey | pixsoTarget | pixsoSpecKey | pixsoTargetStatus | pixsoVariant（仅 ID 行） | mappingStatus（仅 ID 行） | nativeSourceStatus | note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### HTML Component Slot / 子组件映射变更

这张表用于维护父组件内部的结构化子组件，例如 Titlebar 的窗口三键组。它不会把子组件误登记成独立 HTML logicalName。

| state | action | profile | htmlParent | htmlSlot | htmlRole | htmlSelector | pixsoTarget | textToUiSpecKey | variantByHtmlSize | actions | note |
| --- | ------ | ------- | ---------- | -------- | -------- | ------------ | ----------- | ---------------- | ------------------ | ------- | ---- |

### HTML Token ↔ Pixso Variable 变更

\`mappingType\` 可填 \`token\`、\`semantic-token\`、\`runtime-semantic\` 或 \`semantic-color\`。

\`runtime-semantic\` 只用于新增或修改 Runtime-only Alias；如果角色已经存在于 Semantic Token 表，请改对应的 \`semantic-token\` 行，运行时索引会自动继承。

| state | action | profile | mappingType | htmlIdentity | htmlCssVariable | pixsoVariable(s) | pixsoCollection | pixsoMode | valueTransformOrComposition | note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### 填写示例（不会同步）

| state | action | profile | htmlLogicalName | runtimeComponentId（可选） | contractId（仅 ID 行） | htmlRendererKey | pixsoTarget | pixsoSpecKey | pixsoTargetStatus | pixsoVariant（仅 ID 行） | mappingStatus（仅 ID 行） | nativeSourceStatus | note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| example | update | html-to-pixso-harmonyos-client | Button/Primary/Default |  |  | button | Button | Button/Primary/Default | registered |  |  |  | 仅示例；不要把 state 改成 pending，除非确实要提交 |

${EDIT_QUEUE_END}`;
}

export function extractEditQueue(markdown) {
  const start = markdown.indexOf(EDIT_QUEUE_START);
  const end = markdown.indexOf(EDIT_QUEUE_END);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(
      `Obsidian note is missing a valid editable mapping block: ${EDIT_QUEUE_START} ... ${EDIT_QUEUE_END}`,
    );
  }
  return {
    start,
    end: end + EDIT_QUEUE_END.length,
    block: markdown.slice(start, end + EDIT_QUEUE_END.length),
  };
}

export function preserveEditQueue(markdown, fallback = defaultEditQueue()) {
  try {
    let block = extractEditQueue(markdown).block;
    // Legacy workbooks exposed a separate endpoint-ID table. It is now folded
    // into the HTML Component table. Do not discard old pending intent.
    if (block.includes("endpointComponentId")) {
      const pendingLegacyRows = parseEditQueue(markdown).rows.filter(
        (row) => row.type === "endpoint-component" && row.state === "pending",
      );
      if (pendingLegacyRows.length) return block;
      return fallback;
    }
    block = block.replace("只修改下面四张表。", "只修改下面三张表。");
    return block;
  } catch {
    return fallback;
  }
}

function normalizedHeader(value) {
  return String(value || "")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function splitMarkdownRow(line) {
  let source = String(line || "").trim();
  if (source.startsWith("|")) source = source.slice(1);
  if (source.endsWith("|")) source = source.slice(0, -1);
  const cells = [];
  let current = "";
  let escaped = false;
  for (const character of source) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (escaped) current += "\\";
  cells.push(current.trim());
  return cells;
}

function isTableLine(line) {
  return /^\s*\|/.test(line);
}

function isSeparatorRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function stripCell(value) {
  return String(value ?? "")
    .trim()
    .replace(/^<code>([\s\S]*)<\/code>$/, "$1")
    .replace(/^`([\s\S]*)`$/, "$1")
    .trim();
}

export function optionalCell(value) {
  const cleaned = stripCell(value);
  if (!cleaned) return undefined;
  if (NULL_MARKERS.has(cleaned.toLowerCase())) return null;
  return cleaned;
}

export function requiredCell(value, label) {
  const parsed = optionalCell(value);
  if (parsed === undefined || parsed === null || parsed === "") {
    throw new Error(`${label} is required.`);
  }
  return parsed;
}

export function listCell(value) {
  const parsed = optionalCell(value);
  if (parsed === undefined || parsed === null) return parsed;
  return parsed
    .split(/(?:<br>|\n|,)/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function findColumn(header, aliases) {
  const normalized = header.map(normalizedHeader);
  for (const alias of aliases) {
    const index = normalized.indexOf(normalizedHeader(alias));
    if (index >= 0) return index;
  }
  return -1;
}

function tableColumns(header, type) {
  const columns = {
    state: findColumn(header, ["state", "状态"]),
    action: findColumn(header, ["action", "动作"]),
    profile: findColumn(header, ["profile"]),
  };
  if (type === "component") {
    Object.assign(columns, {
      htmlLogicalName: findColumn(header, ["htmlLogicalName"]),
      runtimeComponentId: findColumn(header, ["runtimeComponentId", "runtimeComponentId（可选）", "运行时组件 ID", "componentId"]),
      contractId: findColumn(header, ["contractId", "contractId（仅 ID 行）", "contract"]),
      htmlRendererKey: findColumn(header, ["htmlRendererKey"]),
      pixsoTarget: findColumn(header, ["pixsoTarget"]),
      pixsoSpecKey: findColumn(header, ["pixsoSpecKey"]),
      pixsoTargetStatus: findColumn(header, ["pixsoTargetStatus"]),
      pixsoVariant: findColumn(header, ["pixsoVariant", "pixsoVariant（仅 ID 行）", "variant"]),
      mappingStatus: findColumn(header, ["mappingStatus", "mappingStatus（仅 ID 行）", "映射状态"]),
      nativeSourceStatus: findColumn(header, ["nativeSourceStatus"]),
      note: findColumn(header, ["note", "备注"]),
    });
  } else if (type === "component-slot") {
    Object.assign(columns, {
      htmlParent: findColumn(header, ["htmlParent", "parentHtmlLogicalName"]),
      htmlSlot: findColumn(header, ["htmlSlot"]),
      htmlRole: findColumn(header, ["htmlRole"]),
      htmlSelector: findColumn(header, ["htmlSelector"]),
      pixsoTarget: findColumn(header, ["pixsoTarget"]),
      textToUiSpecKey: findColumn(header, ["textToUiSpecKey"]),
      variantByHtmlSize: findColumn(header, ["variantByHtmlSize"]),
      actions: findColumn(header, ["actions", "actionMappings"]),
      note: findColumn(header, ["note", "备注"]),
    });
  } else if (type === "endpoint-component") {
    Object.assign(columns, {
      endpointComponentId: findColumn(header, ["endpointComponentId", "端侧组件 ID", "componentId"]),
      contractId: findColumn(header, ["contractId", "contract"]),
      htmlLogicalName: findColumn(header, ["htmlLogicalName"]),
      pixsoTarget: findColumn(header, ["pixsoTarget"]),
      pixsoTargetStatus: findColumn(header, ["pixsoTargetStatus"]),
      pixsoVariant: findColumn(header, ["pixsoVariant", "variant"]),
      mappingStatus: findColumn(header, ["mappingStatus", "映射状态"]),
      sourceMappingTarget: findColumn(header, ["sourceMappingTarget", "nativeSourceMappingTarget"]),
      note: findColumn(header, ["note", "备注"]),
    });
  } else {
    Object.assign(columns, {
      mappingType: findColumn(header, ["mappingType"]),
      htmlIdentity: findColumn(header, ["htmlIdentity"]),
      htmlCssVariable: findColumn(header, ["htmlCssVariable"]),
      pixsoVariables: findColumn(header, ["pixsoVariable(s)", "pixsoVariable"]),
      pixsoCollection: findColumn(header, ["pixsoCollection"]),
      pixsoMode: findColumn(header, ["pixsoMode"]),
      valueTransformOrComposition: findColumn(header, ["valueTransformOrComposition", "valueTransform"]),
      note: findColumn(header, ["note", "备注"]),
    });
  }
  return columns;
}

function hasRequiredColumns(columns, type) {
  const common = ["state", "action", "profile"];
  const specific = type === "component"
   ? ["htmlLogicalName"]
    : type === "component-slot"
    ? ["htmlParent", "htmlSlot", "htmlRole"]
    : type === "endpoint-component"
    ? ["endpointComponentId", "contractId", "htmlLogicalName"]
   : ["mappingType", "htmlIdentity"];
  return [...common, ...specific].every((key) => columns[key] >= 0);
}

export function parseEditQueue(markdown) {
  const { block } = extractEditQueue(markdown);
  const lines = block.split(/\r?\n/);
  const rows = [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    if (!isTableLine(lines[lineIndex])) continue;
    const header = splitMarkdownRow(lines[lineIndex]);
    let type = null;
   if (header.some((cell) => normalizedHeader(cell) === "endpointcomponentid")) type = "endpoint-component";
    else if (header.some((cell) => normalizedHeader(cell) === "htmllogicalname")) type = "component";
    if (header.some((cell) => normalizedHeader(cell) === "htmlparent")) type = "component-slot";
   if (header.some((cell) => normalizedHeader(cell) === "mappingtype")) type = "token";
    if (!type) continue;
    const columns = tableColumns(header, type);
    if (!hasRequiredColumns(columns, type)) {
      throw new Error(`Editable ${type} table is missing required columns near line ${lineIndex + 1}.`);
    }
    if (lineIndex + 1 >= lines.length) continue;
    const separator = splitMarkdownRow(lines[lineIndex + 1]);
    if (!isSeparatorRow(separator)) {
      throw new Error(`Editable ${type} table is missing its separator row near line ${lineIndex + 1}.`);
    }
    for (let rowIndex = lineIndex + 2; rowIndex < lines.length; rowIndex += 1) {
      if (!isTableLine(lines[rowIndex])) break;
      const cells = splitMarkdownRow(lines[rowIndex]);
      if (isSeparatorRow(cells)) continue;
      const get = (key) => columns[key] >= 0 ? cells[columns[key]] : undefined;
      const state = (optionalCell(get("state")) || "").toLowerCase();
      if (!state) continue;
      rows.push({
        type,
        lineIndex: rowIndex,
        state,
        action: (optionalCell(get("action")) || "").toLowerCase(),
        profile: optionalCell(get("profile")),
        htmlLogicalName: optionalCell(get("htmlLogicalName")),
        runtimeComponentId: optionalCell(get("runtimeComponentId")),
        endpointComponentId: optionalCell(get("endpointComponentId")),
        contractId: optionalCell(get("contractId")),
        htmlRendererKey: optionalCell(get("htmlRendererKey")),
        pixsoTarget: optionalCell(get("pixsoTarget")),
        pixsoSpecKey: optionalCell(get("pixsoSpecKey")),
        pixsoTargetStatus: optionalCell(get("pixsoTargetStatus")),
       nativeSourceStatus: optionalCell(get("nativeSourceStatus")),
        htmlParent: optionalCell(get("htmlParent")),
        htmlSlot: optionalCell(get("htmlSlot")),
        htmlRole: optionalCell(get("htmlRole")),
        htmlSelector: optionalCell(get("htmlSelector")),
        textToUiSpecKey: optionalCell(get("textToUiSpecKey")),
        variantByHtmlSize: optionalCell(get("variantByHtmlSize")),
        actions: optionalCell(get("actions")),
        pixsoVariant: optionalCell(get("pixsoVariant")),
        mappingStatus: optionalCell(get("mappingStatus")),
        sourceMappingTarget: optionalCell(get("sourceMappingTarget")),
       mappingType: (optionalCell(get("mappingType")) || "").toLowerCase(),
        htmlIdentity: optionalCell(get("htmlIdentity")),
        htmlCssVariable: optionalCell(get("htmlCssVariable")),
        pixsoVariables: listCell(get("pixsoVariables")),
        pixsoCollection: optionalCell(get("pixsoCollection")),
        pixsoMode: optionalCell(get("pixsoMode")),
        valueTransformOrComposition: optionalCell(get("valueTransformOrComposition")),
        note: optionalCell(get("note")),
      });
      lineIndex = rowIndex;
    }
  }
  return { rows, block, lines };
}

export function markRowsApplied(markdown, rows) {
  if (!rows.length) return markdown;
  const extracted = extractEditQueue(markdown);
  const blockLines = extracted.block.split(/\r?\n/);
  const lineIndexes = new Set(rows.map((row) => row.lineIndex));
  for (const lineIndex of lineIndexes) {
    const cells = splitMarkdownRow(blockLines[lineIndex]);
    if (!cells.length) continue;
    cells[0] = "applied";
    blockLines[lineIndex] = "| " + cells.join(" | ") + " |";
  }
  const nextBlock = blockLines.join("\n");
  return markdown.slice(0, extracted.start) + nextBlock + markdown.slice(extracted.end);
}

export function renderTableRow(values) {
  return "| " + values.map((value) => String(value ?? "").replace(/\|/g, "\\|")) .join(" | ") + " |";
}
