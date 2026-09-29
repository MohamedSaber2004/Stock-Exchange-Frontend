<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-vue-next'
import { coreServices } from '@/di'

const toastService = coreServices.toast
const toasts = toastService.toasts
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-5 end-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-4">
      <TransitionGroup
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-3 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md',
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-slate-800'
              : toast.type === 'error'
              ? 'bg-white border-rose-200 text-slate-800'
              : toast.type === 'warning'
              ? 'bg-white border-amber-200 text-slate-800'
              : 'bg-white border-slate-200 text-slate-800',
          ]"
        >
          <!-- Icon -->
          <div class="mt-0.5 shrink-0">
            <CheckCircle2 v-if="toast.type === 'success'" class="w-5 h-5 text-emerald-600" />
            <XCircle v-if="toast.type === 'error'" class="w-5 h-5 text-rose-600" />
            <AlertCircle v-if="toast.type === 'warning'" class="w-5 h-5 text-amber-600" />
            <Info v-if="toast.type === 'info'" class="w-5 h-5 text-blue-600" />
          </div>

          <!-- Text -->
          <div class="flex-1 min-w-0 text-start">
            <h5 v-if="toast.title" class="text-xs font-bold text-slate-900 leading-none mb-1">
              {{ toast.title }}
            </h5>
            <p class="text-xs text-slate-600 leading-relaxed break-words">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close -->
          <button
            class="shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            @click="toastService.dismiss(toast.id)"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
