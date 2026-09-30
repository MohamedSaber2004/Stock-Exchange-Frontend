<script setup lang="ts">
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-vue-next'
import { coreServices } from '@/di'
import { useI18n } from 'vue-i18n'
import AppButton from './AppButton.vue'

const confirmService = coreServices.confirm
const state = confirmService.state
const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="state.isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        @click.self="confirmService.handleCancel"
      >
        <div
          class="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 text-start"
        >
          <!-- Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0',
                  state.type === 'danger'
                    ? 'bg-rose-100 text-rose-600'
                    : state.type === 'warning'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-blue-100 text-blue-600',
                ]"
              >
                <AlertCircle v-if="state.type === 'danger'" class="w-5 h-5 sm:w-6 sm:h-6" />
                <AlertTriangle v-else-if="state.type === 'warning'" class="w-5 h-5 sm:w-6 sm:h-6" />
                <Info v-else class="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 class="text-base font-bold text-slate-900">
                {{ state.title }}
              </h3>
            </div>
            <button
              class="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              @click="confirmService.handleCancel"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed ps-0 sm:ps-14">
            {{ state.message }}
          </p>

          <!-- Footer -->
          <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-3 border-t border-slate-100">
            <AppButton variant="ghost" size="sm" class="w-full sm:w-auto" @click="confirmService.handleCancel">
              {{ state.cancelText || t('common.cancel') }}
            </AppButton>
            <AppButton
              :variant="state.type === 'danger' ? 'danger' : 'primary'"
              size="sm"
              class="w-full sm:w-auto"
              @click="confirmService.handleConfirm"
            >
              {{ state.confirmText || t('common.confirm') }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
