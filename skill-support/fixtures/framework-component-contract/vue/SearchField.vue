<script setup>
import "../shared/interactive-components.css";

defineProps({ value: { type: String, required: true } });
const emit = defineEmits(["update:value"]);
</script>

<template>
  <label class="hm-search" data-component="fixture-search" data-logical-component="Search/White Surface/Default" data-variant="surface=white" :data-state="value ? 'value' : 'default'">
    <input class="hm-search__input" type="search" :value="value" @input="emit('update:value', $event.target.value)" placeholder="搜索项目" aria-label="搜索项目" />
    <button v-if="value" class="hm-search__clear" type="button" @click="emit('update:value', '')">清除</button>
  </label>
</template>
