<script setup lang="ts">
import { ref, computed } from 'vue'
import { Lock, Camera } from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const { toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const profile = ref({
  name: 'Admin',
  email: 'admin@finwise.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const handleAvatarUpload = () => {
  toast.info(isAr.value ? 'تم فتح اختيار الصورة الشخصية' : 'Avatar upload triggered')
}

const handleSaveProfile = () => {
  toast.success(t('settings.profileUpdated'))
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-3xl mx-auto">
      <PageHeader
        :title="t('settings.title')"
        :description="t('settings.subtitle')"
      />

      <!-- Profile & Security Form -->
      <div class="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs flex flex-col gap-6">
        <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {{ t('settings.profileTab') }}
        </h2>

        <!-- Avatar Section -->
        <div class="flex items-center gap-4">
          <div class="relative group">
            <img
              :src="profile.avatar"
              alt="Profile"
              class="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/20"
            />
            <button
              type="button"
              @click="handleAvatarUpload"
              class="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
            >
              <Camera class="w-5 h-5" />
            </button>
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-bold text-slate-900">{{ profile.name }}</span>
            <span class="text-[11px] text-slate-400 font-medium">{{ profile.email }}</span>
            <button
              type="button"
              @click="handleAvatarUpload"
              class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 text-start mt-1 cursor-pointer"
            >
              {{ isAr ? 'تغيير الصورة' : 'Change Photo' }}
            </button>
          </div>
        </div>

        <div class="w-full h-px bg-slate-100" />

        <!-- Full Name & Email -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">{{ t('settings.fullName') }}</label>
            <input
              v-model="profile.name"
              type="text"
              class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">{{ t('settings.adminEmail') }}</label>
            <input
              v-model="profile.email"
              type="email"
              class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 font-medium"
            />
          </div>
        </div>

        <!-- Change Password Fields -->
        <div class="flex flex-col gap-3 pt-2">
          <h3 class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Lock class="w-3.5 h-3.5 text-slate-400" />
            {{ t('settings.securityTab') }}
          </h3>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-slate-700">{{ t('settings.currentPassword') }}</label>
            <input
              v-model="profile.currentPassword"
              type="password"
              placeholder="••••••••"
              class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('settings.newPassword') }}</label>
              <input
                v-model="profile.newPassword"
                type="password"
                placeholder="••••••••"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('settings.confirmNewPassword') }}</label>
              <input
                v-model="profile.confirmPassword"
                type="password"
                placeholder="••••••••"
                class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
          </div>
        </div>

        <!-- Save Profile Action -->
        <div class="pt-4 flex justify-end">
          <button
            type="button"
            @click="handleSaveProfile"
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            {{ t('settings.saveSettings') }}
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
