<script setup>
import { ref } from "vue";
import iconSprite from "../shared/button-icons.svg";
import "../shared/button-gallery.css";

const variants = [
  ["Primary", "btn-primary", "确认操作"],
  ["Secondary", "btn-secondary", "次要操作"],
  ["Ghost", "btn-ghost", "文本操作"],
  ["Danger", "btn-danger", "删除项目"]
];
const iconText = [["Primary", "btn-primary", "add", "新建项目"], ["Secondary", "btn-secondary", "download", "导出文件"], ["Ghost", "btn-icon-text-ghost", "settings", "更多设置"]];
const iconButtons = [["Ghost · Default", "icon-btn", "more", false], ["Secondary · Explicit", "icon-btn icon-btn-secondary", "close", false], ["Ghost · Disabled", "icon-btn", "more", true], ["Secondary · Disabled", "icon-btn icon-btn-secondary", "close", true]];
const selectionOpen = ref(false);
const selection = ref("列表视图");
const splitOpen = ref("");
const iconHref = (name) => `${iconSprite}#hmos-${name}`;
</script>

<template>
  <main class="framework-button-gallery" data-framework="vue" data-component="Button/Module/Complete">
    <div v-for="size in [{ title: 'Standard · 40px', small: false }, { title: 'Small · 28px', small: true }]" :key="size.title" class="button-size-block" :data-logical-group="size.small ? 'Button/Size/Small' : 'Button/Size/Standard'">
      <div class="button-size-title">{{ size.title }}</div>
      <div v-for="disabled in [false, true]" :key="String(disabled)" class="button-state-row">
        <div v-for="item in variants" :key="`${item[0]}-${disabled}`" class="state-group">
          <span class="state-name">{{ item[0] }}{{ disabled ? ' · Disabled' : '' }}</span>
          <button :class="['btn', item[1], size.small && 'btn-sm']" :disabled="disabled">{{ item[2] }}</button>
        </div>
      </div>
    </div>

    <div class="button-size-block" data-logical-group="Button/Icon Text/Default">
      <div class="button-size-title">Icon + Text · 40px · Icon 20px</div>
      <div v-for="disabled in [false, true]" :key="String(disabled)" class="icon-text-row">
        <div v-for="item in iconText" :key="item[0]" class="state-group">
          <span class="state-name">{{ item[0] }}{{ disabled ? ' · Disabled' : '' }}</span>
          <button :class="['btn', item[1], 'btn-icon-text']" :disabled="disabled"><svg viewBox="0 0 24 24" aria-hidden="true" :data-hmos-icon="item[2]"><use :href="iconHref(item[2])" /></svg>{{ item[3] }}</button>
        </div>
      </div>
    </div>

    <div class="button-size-block" data-logical-group="Button/Icon/Default">
      <div class="button-size-title">Icon Button · 图标按钮 · Default = Ghost · 40×40px · Icon 20px</div>
      <div class="icon-button-row"><div v-for="item in iconButtons" :key="item[0]" class="state-group"><span class="state-name">{{ item[0] }}</span><button :class="item[1]" :disabled="item[3]" :aria-label="item[0]"><svg viewBox="0 0 24 24" aria-hidden="true" :data-hmos-icon="item[2]"><use :href="iconHref(item[2])" /></svg></button></div></div>
    </div>

    <div class="button-size-block" data-logical-group="Button/Selection Dropdown/Default">
      <div class="button-size-title">Selection Dropdown · 选择型下拉按钮 · Text + Chevron · Secondary · 40px</div>
      <div class="selection-dropdown-row">
        <div class="state-group dropdown" data-dropdown data-mode="select"><span class="state-name">List selection</span><button class="btn btn-secondary selection-dropdown-trigger dropdown-trigger" type="button" aria-haspopup="menu" :aria-expanded="selectionOpen" @click="selectionOpen = !selectionOpen"><span>{{ selection }}</span><svg class="dropdown-chevron" viewBox="0 0 24 24" aria-hidden="true"><use :href="iconHref('disclosure-down')" /></svg></button><div class="dropdown-menu" role="menu" :hidden="!selectionOpen"><button v-for="item in ['列表视图', '网格视图', '紧凑视图']" :key="item" class="dropdown-menu-item" type="button" role="menuitem" @click="selection = item; selectionOpen = false">{{ item }}</button></div></div>
        <div class="state-group"><span class="state-name">Disabled</span><button class="btn btn-secondary selection-dropdown-trigger" type="button" disabled><span>列表视图</span><svg class="dropdown-chevron" viewBox="0 0 24 24" aria-hidden="true"><use :href="iconHref('disclosure-down')" /></svg></button></div>
      </div>
    </div>

    <div class="button-size-block" data-logical-group="Button/Split Dropdown/Default">
      <div class="button-size-title">Split Dropdown Button · 分裂式下拉按钮 · Ghost · 40px</div>
      <div class="split-dropdown-row">
        <div v-for="split in [{ key: 'export', label: '导出文件', icon: 'download', items: ['导出为 PDF','复制分享链接','发送到设备'] }, { key: 'refresh', label: '', icon: 'refresh', items: ['重新加载','同步数据','清理缓存并刷新'] }]" :key="split.key" class="state-group dropdown" data-dropdown data-mode="action"><span class="state-name">{{ split.label ? 'Icon + Text' : 'Icon' }} · Independent actions</span><div :class="['split-control', !split.label && 'split-control-icon']"><button :class="['split-main', !split.label && 'split-main-icon']" type="button" :aria-label="split.label || '刷新'"><svg class="dropdown-leading-icon" viewBox="0 0 24 24" aria-hidden="true"><use :href="iconHref(split.icon)" /></svg><span v-if="split.label">{{ split.label }}</span></button><button class="split-trigger dropdown-trigger" type="button" aria-label="展开其他操作" aria-haspopup="menu" :aria-expanded="splitOpen === split.key" @click="splitOpen = splitOpen === split.key ? '' : split.key"><svg class="dropdown-chevron" viewBox="0 0 24 24" aria-hidden="true"><use :href="iconHref('disclosure-down')" /></svg></button></div><div class="dropdown-menu" role="menu" :hidden="splitOpen !== split.key"><button v-for="item in split.items" :key="item" class="dropdown-menu-item" type="button" role="menuitem" @click="splitOpen = ''">{{ item }}</button></div></div>
      </div>
      <div class="split-dropdown-row"><div class="state-group"><span class="state-name">Icon + Text · Disabled</span><div class="split-control is-disabled"><button class="split-main" disabled><svg class="dropdown-leading-icon" viewBox="0 0 24 24"><use :href="iconHref('download')" /></svg><span>导出文件</span></button><button class="split-trigger" disabled><svg class="dropdown-chevron" viewBox="0 0 24 24"><use :href="iconHref('disclosure-down')" /></svg></button></div></div><div class="state-group"><span class="state-name">Icon · Disabled</span><div class="split-control split-control-icon is-disabled"><button class="split-main split-main-icon" disabled><svg class="dropdown-leading-icon" viewBox="0 0 24 24"><use :href="iconHref('refresh')" /></svg></button><button class="split-trigger" disabled><svg class="dropdown-chevron" viewBox="0 0 24 24"><use :href="iconHref('disclosure-down')" /></svg></button></div></div></div>
    </div>
    <span class="gallery-status" aria-live="polite">Vue Button 模块已加载</span>
  </main>
</template>
