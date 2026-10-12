<script setup>
import "../shared/primary-action.css";

defineProps({
  label: { type: String, required: true },
  disabled: { type: Boolean, default: false }
});
</script>

<template>
  <button
    class="hm-primary-action"
    type="button"
    data-component="fixture-primary-action"
    data-logical-component="Button/Primary/Default"
    data-variant="size=medium"
    :data-state="disabled ? 'disabled' : 'default'"
    :disabled="disabled"
  >
    {{ label }}
  </button>
</template>
