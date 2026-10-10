<script setup>
import "../shared/interactive-components.css";
defineProps({ item: { type: Object, required: true }, selected: { type: Boolean, default: false } });
defineEmits(["select"]);
</script>

<template>
  <button class="hm-list-item" type="button" data-component="fixture-list-item" data-logical-component="List Item/White Surface/Default" data-variant="surface=white" :data-state="selected ? 'selected' : 'default'" :aria-pressed="selected" @click="$emit('select')"><span>{{ item.label }}</span><span class="hm-list-item__meta">{{ item.meta }}</span></button>
</template>
