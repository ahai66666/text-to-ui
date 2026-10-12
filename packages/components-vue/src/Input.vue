<script setup>
import "./styles.css";
import { computed, nextTick, ref } from "vue";
import Chips from "./Chips.vue";
let nextTagEntryId = 0;
const props = defineProps({ modelValue: String, placeholder: { type: String, default: "请输入内容" }, disabled: Boolean, error: Boolean, state: { type: String, default: "default" }, surface: { type: String, default: "white" }, ariaLabel: { type: String, default: "" }, variant: { type: String, default: "default" }, label: { type: String, default: "成员" }, options: { type: Array, default: () => [] }, tags: { type: Array, default: undefined }, defaultTags: { type: Array, default: () => [] } });
const emit = defineEmits(["update:modelValue", "update:tags", "focus", "blur"]);
const focused = ref(false);
const resolvedState = computed(() => props.disabled ? "disabled" : props.state !== "default" ? props.state : props.error ? "error" : focused.value ? "focus" : "default");
const tagEntryId = `tui-input-tag-entry-${++nextTagEntryId}`;
const labelId = `${tagEntryId}-label`;
const listboxId = `${tagEntryId}-suggestions`;
const inputRef = ref(null);
const internalQuery = ref(props.modelValue ?? "");
const query = computed(() => props.modelValue ?? internalQuery.value);
const internalTags = ref(Array.isArray(props.defaultTags) ? props.defaultTags.map(String) : []);
const selectedTags = computed(() => Array.isArray(props.tags) ? props.tags.map(String) : internalTags.value);
const isOpen = ref(false);
const activeIndex = ref(-1);
const normalizedOptions = computed(() => Array.isArray(props.options) ? props.options.filter((option) => option !== null && option !== undefined && String(option).trim()).map(String) : []);
const filteredOptions = computed(() => {
  const selected = new Set(selectedTags.value.map((tag) => tag.toLocaleLowerCase()));
  const filter = String(query.value ?? "").trim().toLocaleLowerCase();
  return normalizedOptions.value.filter((option) => !selected.has(option.toLocaleLowerCase()) && (!filter || option.toLocaleLowerCase().includes(filter)));
});
const updateQuery = (event) => {
  internalQuery.value = event.target.value;
  emit("update:modelValue", event.target.value);
  activeIndex.value = -1;
};
const updateTags = (nextTags) => {
  if (props.tags === undefined) internalTags.value = nextTags;
  emit("update:tags", nextTags);
};
const removeTag = async (index) => {
  updateTags(selectedTags.value.filter((_, tagIndex) => tagIndex !== index));
  await nextTick();
  inputRef.value?.focus();
};
const selectOption = async (option) => {
  if (selectedTags.value.some((tag) => tag.toLocaleLowerCase() === option.toLocaleLowerCase())) return;
  updateTags([...selectedTags.value, option]);
  internalQuery.value = "";
  emit("update:modelValue", "");
  activeIndex.value = -1;
  isOpen.value = false;
  await nextTick();
  inputRef.value?.focus();
};
const onInputKeydown = (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    if (!isOpen.value) isOpen.value = true;
    else if (activeIndex.value >= 0 && filteredOptions.value[activeIndex.value]) selectOption(filteredOptions.value[activeIndex.value]);
  } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (!isOpen.value) {
      isOpen.value = true;
      activeIndex.value = event.key === "ArrowDown" ? 0 : filteredOptions.value.length - 1;
    } else if (filteredOptions.value.length > 0) {
      activeIndex.value = event.key === "ArrowDown"
        ? (activeIndex.value + 1) % filteredOptions.value.length
        : activeIndex.value < 0 ? filteredOptions.value.length - 1 : (activeIndex.value - 1 + filteredOptions.value.length) % filteredOptions.value.length;
    }
  } else if (event.key === "Escape" && isOpen.value) {
    event.preventDefault();
    isOpen.value = false;
    activeIndex.value = -1;
  }
};
const onTagEntryFocusout = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    focused.value = false;
    isOpen.value = false;
    activeIndex.value = -1;
  }
};
</script>
<template>
  <div v-if="variant === 'tag-entry'" class="tui-component tui-input tui-input--tag-entry" data-component="input" data-logical-component="Input/Tag Entry/Default" data-variant="tag-entry" :data-state="resolvedState" :data-surface="surface" data-framework="vue" data-input-tag-entry role="group" :aria-labelledby="labelId" @focusin="focused = true" @focusout="onTagEntryFocusout">
    <label class="tui-input-tag-entry__label" :id="labelId" :for="tagEntryId" data-slot="label" data-typography-role="body-l">{{ label }}</label>
    <div class="tui-input-tag-entry__editor">
      <div class="tui-input-tag-entry__tags" data-slot="tags" role="list" :aria-label="`${label}已选`">
        <Chips v-for="(tag, index) in selectedTags" :key="`${tag}-${index}`" :label="tag" icon="" :disabled="disabled" closable role="listitem" @close="removeTag(index)" />
      </div>
      <input :id="tagEntryId" ref="inputRef" class="tui-input-tag-entry__input" data-slot="value" data-typography-role="body-l" type="text" role="combobox" aria-autocomplete="list" :aria-expanded="isOpen" :aria-controls="listboxId" :aria-labelledby="labelId" :aria-activedescendant="isOpen && activeIndex >= 0 && filteredOptions[activeIndex] ? `${listboxId}-option-${activeIndex + 1}` : undefined" :aria-invalid="error || state === 'error' ? 'true' : undefined" autocomplete="off" :value="query" :placeholder="placeholder" :disabled="disabled" @input="updateQuery" @focus="focused = true; emit('focus', $event)" @blur="emit('blur', $event)" @keydown="onInputKeydown" />
      <div :id="listboxId" class="tui-advanced-menu__panel tui-input-tag-entry__menu" role="listbox" :aria-label="`${label}建议`" :hidden="!isOpen">
        <button v-for="(option, index) in filteredOptions" :id="`${listboxId}-option-${index + 1}`" :key="`${option}-${index}`" class="tui-advanced-menu__item" type="button" role="option" :aria-selected="activeIndex === index" data-typography-role="body-l" @mousedown.prevent @mouseenter="activeIndex = index" @click="selectOption(option)">{{ option }}</button>
        <div v-if="filteredOptions.length === 0" class="tui-input-tag-entry__empty">无匹配项</div>
      </div>
    </div>
  </div>
  <label v-else class="tui-component tui-input" data-component="input" data-logical-component="Input/White Surface/Default" data-variant="default" :data-state="resolvedState" :data-surface="surface" data-framework="vue"><input data-slot="value" data-typography-role="body-l" :value="modelValue" :placeholder="placeholder" :disabled="disabled" :aria-label="ariaLabel || undefined" :aria-invalid="error || state === 'error' ? 'true' : undefined" @focus="focused = true" @blur="focused = false" @input="emit('update:modelValue', $event.target.value)" /></label>
</template>
