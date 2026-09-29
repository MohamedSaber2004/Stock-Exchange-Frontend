<script setup lang="ts">
import { RouterView } from 'vue-router'
import RouteLoadingIndicator from '@/components/layout/RouteLoadingIndicator.vue'
</script>

<template>
  <RouteLoadingIndicator />
  <RouterView />
</template>
