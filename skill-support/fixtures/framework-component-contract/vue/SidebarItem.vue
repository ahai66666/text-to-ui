<script setup>
import "../shared/interactive-components.css";
defineProps({ label: { type: String, required: true }, selected: { type: Boolean, default: false } });
defineEmits(["select"]);
</script>

<template>
  <button class="hm-sidebar-item" type="button" data-component="fixture-sidebar-item" data-logical-component="Sidebar Item/Default" data-variant="size=medium" :data-state="selected ? 'selected' : 'default'" :aria-current="selected ? 'page' : undefined" @click="$emit('select')">{{ label }}</button>
</template>
