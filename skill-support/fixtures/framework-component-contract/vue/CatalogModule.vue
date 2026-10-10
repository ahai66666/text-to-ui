<script setup>
import { onMounted, ref, watch } from "vue";
import { mountCatalogModule } from "../shared/catalog-module.js";
import "../shared/catalog-module.css";

const props = defineProps({ moduleId: { type: String, required: true } });
const root = ref(null);
const status = ref("loading");
async function load() {
  status.value = "loading";
  try { await mountCatalogModule(root.value, props.moduleId, "vue"); status.value = "ready"; }
  catch { status.value = "error"; }
}
onMounted(load);
watch(() => props.moduleId, load);
</script>

<template>
  <main ref="root" class="framework-catalog-module" data-component="Catalog Module" :data-logical-component="`Catalog/${moduleId}`" data-variant="gallery" :data-state="status" />
</template>
