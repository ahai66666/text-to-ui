<script setup>
import "./styles.css";
import { ref, computed } from "vue";
import Icon from "./Icon.js";
import Button from "./Button.vue";
import { DropdownMenu } from "./advanced.js";
const supportedStates = new Set(["default", "focus", "typing", "filled", "hover-left", "hover-right", "pressed-left", "pressed-right", "disabled"]);
const props = defineProps({ modelValue: String, placeholder: { type: String, default: "搜索" }, disabled: Boolean, state: { type: String, default: "default" }, surface: { type: String, default: "white" }, advancedSearch: Boolean, advancedSearchLabel: { type: String, default: "高级" }, scope: String, defaultScope: String, scopeOptions: { type: Array, default: () => [] }, scopeLabel: { type: String, default: "搜索范围" } });
const emit = defineEmits(["update:modelValue", "update:scope", "scope-change", "clear", "advanced-search"]);
const focused = ref(false);
const internalValue = ref("");
const internalScope = ref(props.defaultScope ?? props.scopeOptions.filter(Boolean)[0] ?? "");
const currentValue = computed(() => props.modelValue === undefined ? internalValue.value : props.modelValue);
const normalizedScopeOptions = computed(() => props.scopeOptions.filter(Boolean));
const scoped = computed(() => normalizedScopeOptions.value.length > 0);
const currentScope = computed(() => props.scope === undefined ? internalScope.value : props.scope);
const isDisabled = computed(() => props.disabled || props.state === "disabled");
const resolvedState = computed(() => { const requestedState = supportedStates.has(props.state) ? props.state : "default"; return isDisabled.value ? "disabled" : requestedState !== "default" ? requestedState : focused.value ? currentValue.value ? "typing" : "focus" : currentValue.value ? "filled" : "default"; });
const update = (event) => { if (props.modelValue === undefined) internalValue.value = event.target.value; emit("update:modelValue", event.target.value); };
const clear = (event) => { if (props.modelValue === undefined) internalValue.value = ""; emit("clear", event); };
const updateScope = (next, event) => { if (props.scope === undefined) internalScope.value = next; emit("update:scope", next); emit("scope-change", next, event); };
</script>
<template>
  <label class="tui-component tui-search" data-component="search" :data-logical-component="scoped ? 'Search/Scoped/Default' : 'Search/White Surface/Default'" :data-variant="scoped ? advancedSearch ? 'scoped-advanced-search' : 'scoped-search' : advancedSearch ? 'advanced-search' : 'default'" :data-state="resolvedState" :data-surface="surface" data-framework="vue"><DropdownMenu v-if="scoped" class-name="tui-search__scope" slot-name="scope-selector" compact hide-label :label="scopeLabel" :value="currentScope" :items="normalizedScopeOptions" :aria-label="scopeLabel" :disabled="isDisabled" @select="updateScope" /><span class="tui-search__input-region" data-search-input-region><span data-slot="leading"><Icon name="field/search" :size="16" /></span><input data-slot="value" data-typography-role="body-l" type="search" :value="currentValue" :placeholder="placeholder" :disabled="isDisabled" @focus="focused = true" @blur="focused = false" @input="update" /><button v-if="currentValue" class="tui-icon-button" data-slot="clear" type="button" aria-label="清除" :disabled="isDisabled" @click="clear"><Icon name="action/close" :size="16" /></button><Button v-if="advancedSearch" class="tui-search__advanced" :label="advancedSearchLabel" variant="ghost" size="small" mode="text" type="button" :aria-label="advancedSearchLabel" aria-haspopup="dialog" :disabled="isDisabled" data-slot="advanced-search" data-typography-role="body-m" @click="emit('advanced-search')" /></span></label>
</template>
