<script setup>
import { computed, ref } from "vue";
import PrimaryAction from "../vue/PrimaryAction.vue";
import SearchField from "../vue/SearchField.vue";
import SidebarItem from "../vue/SidebarItem.vue";
import ListItem from "../vue/ListItem.vue";
import ButtonGallery from "../vue/ButtonGallery.vue";
import CatalogModule from "../vue/CatalogModule.vue";
import "./demo-shell.css";

const items = [
  { label: "设计系统", meta: "刚刚更新" },
  { label: "Coremail", meta: "3 个任务" },
  { label: "组件映射", meta: "待验证" }
];
const disabled = ref(false);
const query = ref("");
const section = ref("收件箱");
const selected = ref(items[0].label);
const notice = ref("准备就绪");
const filtered = computed(() => items.filter((item) => item.label.includes(query.value)));
const component = new URLSearchParams(window.location.search).get("component") ?? "button";
const moduleId = new URLSearchParams(window.location.search).get("module");
window.setFixtureState = (value) => { disabled.value = value; };
</script>

<template>
  <ButtonGallery v-if="component === 'button-gallery'" />
  <CatalogModule v-else-if="component === 'catalog-module' && moduleId" :module-id="moduleId" />
  <main v-else class="fixture-demo-shell">
    <p class="fixture-demo-kicker">Vue · source-component · 可交互</p>
    <PrimaryAction v-if="component === 'button'" label="写邮件" :disabled="disabled" @click="notice = '已打开写邮件流程'" />
    <template v-if="component === 'sidebar'">
      <nav class="hm-sidebar-nav" aria-label="邮件导航">
        <SidebarItem v-for="label in ['收件箱', '草稿', '已发送']" :key="label" :label="label" :selected="section === label" @select="section = label; notice = `已切换到${label}`" />
      </nav>
    </template>
    <SearchField v-else-if="component === 'search'" :value="query" @update:value="query = $event; notice = $event ? `正在搜索：${$event}` : '搜索已清除'" />
    <section v-else-if="component === 'list'" class="hm-work-list" aria-label="项目列表"><ListItem v-for="item in items" :key="item.label" :item="item" :selected="selected === item.label" @select="selected = item.label; notice = `已选择${item.label}`" /></section>
    <p class="hm-component-lab__status" aria-live="polite">{{ notice }}</p>
  </main>
</template>
