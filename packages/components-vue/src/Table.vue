<script setup>
import "./styles.css";
import Badge from "./Badge.vue";
const props = defineProps({ componentId: { type: String, default: "table" }, title: { type: String, default: "项目列表" }, columns: { type: Array, default: () => ["名称", "负责人", "状态"] }, rows: { type: Array, default: () => [["客户端设计系统", "赵博海", "进行中"], ["组件规范", "林晓", "已完成"]] } });
const logicalName = props.componentId === "data-table" ? "Data Table/Default" : "Table/Default";
</script>
<template><div class="tui-component tui-table" :data-component="props.componentId" :data-logical-component="logicalName" data-variant="default" data-state="default" data-framework="vue"><div class="tui-table__heading"><h4 data-slot="title" data-typography-role="title-s">{{ props.title }}</h4><span data-slot="description" data-typography-role="body-s">{{ props.rows.length }} 个项目</span></div><table><thead><tr><th v-for="(column, index) in props.columns" :key="index" scope="col" data-typography-role="body-m">{{ column }}</th></tr></thead><tbody><tr v-for="(row, rowIndex) in props.rows" :key="rowIndex"><td v-for="(value, cellIndex) in row" :key="cellIndex" data-typography-role="body-l"><Badge v-if="cellIndex === 2 && value === '进行中'" :label="value" tone="info" /><Badge v-else-if="cellIndex === 2 && value === '已完成'" :label="value" tone="success" /><template v-else>{{ value }}</template></td></tr></tbody></table></div></template>
