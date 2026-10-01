<script setup lang="ts">
import { RouterView } from 'vue-router'
import RouteLoadingIndicator from '@/components/layout/RouteLoadingIndicator.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
</script>

<template>
  <RouteLoadingIndicator />
  <RouterView />
  <ToastContainer />
  <ConfirmModal />
</template>

