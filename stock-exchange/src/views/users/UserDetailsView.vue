<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Phone,
  Globe,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Save,
  Clock,
  RefreshCw,
  ShieldAlert
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DataState from '@/components/ui/DataState.vue'
import { coreServices } from '@/di'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { UserType, type UserDetailsDto } from '@/domain/models/user.model'
import type { CountryDto } from '@/domain/models/country.model'
import type { AppError } from '@/domain/models/common.model'
import { resolveAttachmentUrl, handleImageError, getCleanPhoneInfo } from '@/utils/attachment'

const router = useRouter()
const route = useRoute()
const { confirm, toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const userId = computed(() => String(route.params.id || ''))

const currentAdmin = computed(() => coreServices.tokenStore.getUser())
const isOtherAdmin = computed(() => Boolean(user.value && user.value.userType === UserType.Admin && user.value.id !== currentAdmin.value?.id))

// State
const user = ref<UserDetailsDto | null>(null)
const countries = ref<CountryDto[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const isChangingPassword = ref(false)
const isDeleting = ref(false)
const errorMessage = ref<string | null>(null)

// Edit Form State
const editFormErrors = ref<Record<string, string>>({})
const editForm = ref({
  fullName: '',
  email: '',
  phoneNumber: '',
  countryId: '',
  userType: UserType.Customer,
  isActive: true
})

const selectedEditCountry = computed(() =>
  countries.value.find(c => c.id === editForm.value.countryId)
)

// Change Password State
const showNewPassword = ref(false)
const passwordErrors = ref<Record<string, string>>({})
const passwordForm = ref({
  newPassword: '',
  confirmNewPassword: ''
})

// Fetch User & Countries
const loadUserData = async () => {
  if (!userId.value) {
    router.push('/users')
    return
  }

  isLoading.value = true
  errorMessage.value = null

  try {
    const [fetchedUser, fetchedCountries] = await Promise.all([
      coreServices.users.getById(userId.value),
      coreServices.countries.getAll().catch(() => [])
    ])

    user.value = fetchedUser
    countries.value = fetchedCountries

    const country = fetchedCountries.find(c => c.id === fetchedUser.countryId)
    const phoneInfo = getCleanPhoneInfo(fetchedUser.phoneNumber, country?.code)

    // Initialize Form with cleaned phone number
    editForm.value = {
      fullName: fetchedUser.fullName,
      email: fetchedUser.email,
      phoneNumber: phoneInfo.cleanNumber,
      countryId: fetchedUser.countryId || '',
      userType: fetchedUser.userType,
      isActive: fetchedUser.isActive
    }
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'تعذر تحميل بيانات المستخدم' : 'Failed to load user details')
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadUserData()
})

// Helpers
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-'
  try {
    const d = new Date(dateString)
    return d.toLocaleString(isAr.value ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

// Save Changes
const handleSave = async () => {
  if (!user.value) return
  if (isOtherAdmin.value) {
    toast.warning(isAr.value ? 'لا يمكن تعديل بيانات مسؤول آخر.' : 'You cannot modify details of another administrator.')
    return
  }
  editFormErrors.value = {}

  const f = editForm.value
  if (!f.fullName.trim()) {
    editFormErrors.value.fullName = isAr.value ? 'الاسم الكامل مطلوب' : 'Full name is required'
  }
  if (!f.email.trim()) {
    editFormErrors.value.email = isAr.value ? 'البريد الإلكتروني مطلوب' : 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
    editFormErrors.value.email = isAr.value ? 'البريد الإلكتروني غير صالح' : 'Invalid email format'
  }

  if (Object.keys(editFormErrors.value).length > 0) return

  isSaving.value = true
  try {
    const userCountry = countries.value.find(c => c.id === f.countryId)
    const cleanPhone = f.phoneNumber.trim()
      ? getCleanPhoneInfo(f.phoneNumber, userCountry?.code).cleanNumber
      : null

    const updated = await coreServices.users.update(user.value.id, {
      id: user.value.id,
      fullName: f.fullName.trim(),
      email: f.email.trim(),
      phoneNumber: cleanPhone,
      countryId: f.countryId || null,
      userType: f.userType,
      isActive: f.isActive
    })

    // Update local state
    user.value = {
      ...user.value,
      ...updated,
      updatedAt: new Date().toISOString()
    }

    toast.success(isAr.value ? 'تم حفظ التعديلات بنجاح' : 'Changes saved successfully')
  } catch (err: unknown) {
    const appErr = err as AppError
    if (appErr.fieldErrors) {
      editFormErrors.value = appErr.fieldErrors
    }
    toast.error(appErr?.message || (isAr.value ? 'فشل حفظ التعديلات' : 'Failed to save changes'))
  } finally {
    isSaving.value = false
  }
}

// Change Password
const handleChangePassword = async () => {
  if (!user.value) return
  if (isOtherAdmin.value) {
    toast.warning(isAr.value ? 'لا يمكن تغيير كلمة مرور مسؤول آخر.' : 'You cannot change password of another administrator.')
    return
  }
  passwordErrors.value = {}

  const p = passwordForm.value
  if (!p.newPassword) {
    passwordErrors.value.newPassword = isAr.value ? 'يرجى إدخال كلمة المرور الجديدة' : 'New password is required'
  } else if (p.newPassword.length < 6) {
    passwordErrors.value.newPassword = isAr.value ? 'يجب ألا تقل كلمة المرور عن 6 أحرف' : 'Password must be at least 6 characters'
  }
  if (p.newPassword !== p.confirmNewPassword) {
    passwordErrors.value.confirmNewPassword = isAr.value ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'
  }

  if (Object.keys(passwordErrors.value).length > 0) return

  isChangingPassword.value = true
  try {
    await coreServices.users.changePassword(user.value.id, {
      newPassword: p.newPassword,
      confirmNewPassword: p.confirmNewPassword
    })

    toast.success(isAr.value ? 'تم تغيير كلمة المرور للمستخدم بنجاح' : 'User password updated successfully')
    passwordForm.value.newPassword = ''
    passwordForm.value.confirmNewPassword = ''
  } catch (err: unknown) {
    const appErr = err as AppError
    if (appErr.fieldErrors) {
      passwordErrors.value = appErr.fieldErrors
    }
    toast.error(appErr?.message || (isAr.value ? 'فشل تحديث كلمة المرور' : 'Failed to update password'))
  } finally {
    isChangingPassword.value = false
  }
}

// Delete Account
const handleDeleteUser = async () => {
  if (!user.value) return
  if (isOtherAdmin.value) {
    toast.warning(isAr.value ? 'لا يمكن حذف حساب مسؤول آخر.' : 'You cannot delete another administrator account.')
    return
  }

  const ok = await confirm({
    title: isAr.value ? `حذف حساب "${user.value.fullName}"` : `Delete Account ("${user.value.fullName}")`,
    message: isAr.value
      ? `هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً؟ سيتم إلغاء الجلسات النشطة وتعطيل الدخول.`
      : `Are you sure you want to permanently delete this account? Active sessions will be terminated and access revoked.`,
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (ok) {
    isDeleting.value = true
    try {
      await coreServices.users.delete(user.value.id)
      toast.success(isAr.value ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully')
      router.push('/users')
    } catch (err: unknown) {
      const appErr = err as AppError
      toast.error(appErr?.message || (isAr.value ? 'فشل حذف المستخدم' : 'Failed to delete user'))
    } finally {
      isDeleting.value = false
    }
  }
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-5xl mx-auto space-y-6">
      <!-- Back Navigation Button -->
      <div>
        <button
          type="button"
          @click="router.push('/users')"
          class="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft class="w-4 h-4 rtl:rotate-180" />
          <span>{{ t('common.back') }}</span>
        </button>
      </div>

      <!-- Data State Container -->
      <DataState
        :loading="isLoading"
        :error="errorMessage"
        @retry="loadUserData"
      >
        <div v-if="user" class="space-y-6">
          
          <!-- Top Profile Banner Card -->
          <div class="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-4 sm:gap-5">
              <!-- Avatar with Global Fallback Placeholder -->
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-slate-200 shrink-0 shadow-xs bg-slate-50">
                <img
                  :src="resolveAttachmentUrl(user.profilePictureUrl, 'avatar')"
                  :alt="user.fullName"
                  @error="handleImageError($event, 'avatar')"
                  class="w-full h-full object-cover"
                />
              </div>

              <!-- Identity Details -->
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {{ user.fullName }}
                  </h1>
                </div>
                
                <span class="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  {{ user.email }}
                </span>

                <!-- Badges Row -->
                <div class="flex flex-wrap items-center gap-2 mt-2.5">
                  <!-- Role Badge -->
                  <span
                    v-if="user.userType === UserType.Admin"
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs shadow-2xs"
                  >
                    <ShieldCheck class="w-3.5 h-3.5 text-indigo-600" />
                    <span>{{ isAr ? (user.userTypeArabic || 'مدير') : (user.userTypeEnglish || 'Admin') }}</span>
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs"
                  >
                    <UserIcon class="w-3.5 h-3.5 text-slate-500" />
                    <span>{{ isAr ? (user.userTypeArabic || 'عميل') : (user.userTypeEnglish || 'Customer') }}</span>
                  </span>

                  <!-- Status Badge -->
                  <StatusBadge :status="user.isActive ? 'ACTIVE' : 'INACTIVE'">
                    {{ user.isActive ? (isAr ? 'حساب نشط' : 'Active Account') : (isAr ? 'حساب معطل' : 'Inactive Account') }}
                  </StatusBadge>
                </div>
              </div>
            </div>

            <!-- Metadata (ID is removed per user requirement) -->
            <div class="flex flex-col items-start md:items-end gap-1.5 shrink-0">
              <span class="text-xs text-slate-500 font-medium">
                {{ isAr ? 'انضم في:' : 'Joined:' }} {{ formatDate(user.createdAt) }}
              </span>
            </div>
          </div>

          <!-- Protected Admin Notice -->
          <div
            v-if="isOtherAdmin"
            class="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-center gap-3.5 text-amber-900 text-xs shadow-2xs"
          >
            <ShieldAlert class="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p class="font-bold">{{ isAr ? 'حساب مسؤول محمي (صلاحيات القراءة فقط)' : 'Protected Admin Account (Read-Only)' }}</p>
              <p class="text-amber-700 mt-0.5">{{ isAr ? 'لا يمكن لأي مسؤول تعديل بيانات أو تغيير كلمة مرور أو حذف حساب مسؤول آخر لأسباب أمنية.' : 'Administrators cannot modify details, reset password, or delete another administrator account for security reasons.' }}</p>
            </div>
          </div>

          <!-- Main Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Left / Center Form: Edit User Details (Col-span 2) -->
            <div class="lg:col-span-2 space-y-6">
              
              <!-- User Details Form Card -->
              <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs">
                <div class="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                  <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <UserIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <h2 class="text-sm font-black text-slate-900">{{ t('users.editUser') }}</h2>
                    <p class="text-xs text-slate-500">{{ isAr ? 'تحديث المعلومات الشخصية ونوع الحساب وحالة النشاط' : 'Update profile details, role, and activation status' }}</p>
                  </div>
                </div>

                <form @submit.prevent="handleSave" class="space-y-5">
                  <!-- Full Name & Email -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-slate-700">{{ t('users.fullName') }} <span class="text-rose-500">*</span></label>
                      <input
                        type="text"
                        v-model="editForm.fullName"
                        :disabled="isOtherAdmin"
                        class="w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        :class="{ 'border-rose-400 bg-rose-50/30': editFormErrors.fullName }"
                      />
                      <span v-if="editFormErrors.fullName" class="text-[11px] text-rose-500 font-medium block">
                        {{ editFormErrors.fullName }}
                      </span>
                    </div>

                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-slate-700">{{ t('users.email') }} <span class="text-rose-500">*</span></label>
                      <div class="relative">
                        <Mail class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          v-model="editForm.email"
                          :disabled="isOtherAdmin"
                          dir="ltr"
                          class="w-full bg-slate-50 border rounded-xl ps-10 pe-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          :class="{ 'border-rose-400 bg-rose-50/30': editFormErrors.email }"
                        />
                      </div>
                      <span v-if="editFormErrors.email" class="text-[11px] text-rose-500 font-medium block">
                        {{ editFormErrors.email }}
                      </span>
                    </div>
                  </div>

                  <!-- Phone Number & Country -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-slate-700">{{ t('users.phoneNumber') }}</label>
                      <div class="relative flex items-center">
                        <span
                          v-if="selectedEditCountry?.code"
                          class="absolute start-3 z-10 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[11px] font-mono select-none"
                        >
                          {{ selectedEditCountry.code }}
                        </span>
                        <Phone v-else class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          v-model="editForm.phoneNumber"
                          :disabled="isOtherAdmin"
                          dir="ltr"
                          :placeholder="isAr ? 'مثال: 100 123 4567' : 'e.g. 100 123 4567'"
                          class="w-full bg-slate-50 border rounded-xl pe-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                          :class="selectedEditCountry?.code ? 'ps-18' : 'ps-10'"
                        />
                      </div>
                    </div>

                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-slate-700">{{ t('users.country') }}</label>
                      <div class="relative">
                        <Globe class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          v-model="editForm.countryId"
                          :disabled="isOtherAdmin"
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl ps-10 pe-8 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="">{{ t('users.selectCountry') }}</option>
                          <option v-for="c in countries" :key="c.id" :value="c.id">
                            {{ isAr ? c.countryArName : c.countryEnName }} ({{ c.code }})
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Role Selector -->
                  <div class="pt-4 border-t border-slate-100 space-y-3">
                    <label class="text-xs font-bold text-slate-700">{{ t('users.roleCol') }}</label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <!-- Customer Option -->
                      <label
                        :class="[
                          'flex items-start gap-3 p-3.5 rounded-2xl border transition-all select-none',
                          editForm.userType === UserType.Customer
                            ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/10'
                            : 'border-slate-200 hover:bg-slate-50',
                          isOtherAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        ]"
                      >
                        <input
                          type="radio"
                          :value="UserType.Customer"
                          v-model="editForm.userType"
                          :disabled="isOtherAdmin"
                          class="mt-1 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed"
                        />
                        <div class="flex flex-col">
                          <span class="text-xs font-bold text-slate-900">{{ t('users.roleCustomer') }}</span>
                          <span class="text-[11px] text-slate-500 mt-0.5">
                            {{ isAr ? 'مستخدم عادي للخدمات التعليمية والتحليلات بالمنصة' : 'Standard user with platform learning access' }}
                          </span>
                        </div>
                      </label>

                      <!-- Admin Option -->
                      <label
                        :class="[
                          'flex items-start gap-3 p-3.5 rounded-2xl border transition-all select-none',
                          editForm.userType === UserType.Admin
                            ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/10'
                            : 'border-slate-200 hover:bg-slate-50',
                          isOtherAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        ]"
                      >
                        <input
                          type="radio"
                          :value="UserType.Admin"
                          v-model="editForm.userType"
                          :disabled="isOtherAdmin"
                          class="mt-1 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                        />
                        <div class="flex flex-col">
                          <span class="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                            <Shield class="w-3.5 h-3.5 text-indigo-600" />
                            {{ t('users.roleAdmin') }}
                          </span>
                          <span class="text-[11px] text-slate-500 mt-0.5">
                            {{ isAr ? 'صلاحيات كاملة للوصول للوحة التحكم وإدارة المحتوى' : 'Full access to admin dashboard and platform content' }}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- Account Status Checkbox / Toggle -->
                  <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-4">
                    <div class="flex flex-col">
                      <span class="text-xs font-bold text-slate-900">{{ t('users.accountActive') }}</span>
                      <span class="text-[11px] text-slate-500 mt-0.5">{{ t('users.accountActiveDesc') }}</span>
                    </div>
                    <input
                      type="checkbox"
                      v-model="editForm.isActive"
                      :disabled="isOtherAdmin"
                      class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <!-- Submit Save Button -->
                  <div class="pt-3 flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      :disabled="isSaving || isOtherAdmin"
                      class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                    >
                      <RefreshCw v-if="isSaving" class="w-3.5 h-3.5 animate-spin" />
                      <Save v-else class="w-3.5 h-3.5" />
                      <span>{{ isSaving ? t('common.loading') : t('common.save') }}</span>
                    </button>
                  </div>
                </form>
              </div>

              <!-- Admin Reset Password Section -->
              <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs">
                <div class="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                  <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <KeyRound class="w-4 h-4" />
                  </div>
                  <div>
                    <h2 class="text-sm font-black text-slate-900">{{ t('users.changePasswordTitle') }}</h2>
                    <p class="text-xs text-slate-500">{{ t('users.changePasswordSubtitle') }}</p>
                  </div>
                </div>

                <form @submit.prevent="handleChangePassword" class="space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-slate-700">{{ t('users.newPassword') }} <span class="text-rose-500">*</span></label>
                      <div class="relative">
                        <Lock class="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          :type="showNewPassword ? 'text' : 'password'"
                          v-model="passwordForm.newPassword"
                          :disabled="isOtherAdmin"
                          dir="ltr"
                          placeholder="••••••••"
                          class="w-full bg-slate-50 border rounded-xl ps-9 pe-9 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          :class="{ 'border-rose-400 bg-rose-50/30': passwordErrors.newPassword }"
                        />
                        <button
                          type="button"
                          @click="showNewPassword = !showNewPassword"
                          :disabled="isOtherAdmin"
                          class="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <EyeOff v-if="showNewPassword" class="w-3.5 h-3.5" />
                          <Eye v-else class="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span v-if="passwordErrors.newPassword" class="text-[10px] text-rose-500 font-medium block">
                        {{ passwordErrors.newPassword }}
                      </span>
                    </div>

                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-slate-700">{{ t('users.confirmNewPassword') }} <span class="text-rose-500">*</span></label>
                      <div class="relative">
                        <Lock class="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          :type="showNewPassword ? 'text' : 'password'"
                          v-model="passwordForm.confirmNewPassword"
                          :disabled="isOtherAdmin"
                          dir="ltr"
                          placeholder="••••••••"
                          class="w-full bg-slate-50 border rounded-xl ps-9 pe-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          :class="{ 'border-rose-400 bg-rose-50/30': passwordErrors.confirmNewPassword }"
                        />
                      </div>
                      <span v-if="passwordErrors.confirmNewPassword" class="text-[10px] text-rose-500 font-medium block">
                        {{ passwordErrors.confirmNewPassword }}
                      </span>
                    </div>
                  </div>

                  <div class="pt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      :disabled="isChangingPassword || isOtherAdmin"
                      class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                    >
                      <RefreshCw v-if="isChangingPassword" class="w-3.5 h-3.5 animate-spin" />
                      <KeyRound v-else class="w-3.5 h-3.5" />
                      <span>{{ isChangingPassword ? t('common.loading') : t('users.changePassword') }}</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>

            <!-- Right Sidebar: System Metadata & Danger Zone (Col-span 1) -->
            <div class="space-y-6">
              
              <!-- System Metadata Card -->
              <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {{ isAr ? 'معلومات النظام' : 'System Information' }}
                </h3>

                <div class="space-y-3 divide-y divide-slate-100 text-xs">
                  <!-- Created At -->
                  <div class="pt-2 flex items-center justify-between">
                    <span class="text-slate-500 flex items-center gap-1.5">
                      <Clock class="w-3.5 h-3.5 text-slate-400" />
                      {{ t('users.createdAt') }}
                    </span>
                    <span class="font-semibold text-slate-800">{{ formatDate(user.createdAt) }}</span>
                  </div>

                  <!-- Updated At -->
                  <div class="pt-3 flex items-center justify-between">
                    <span class="text-slate-500 flex items-center gap-1.5">
                      <RefreshCw class="w-3.5 h-3.5 text-slate-400" />
                      {{ t('users.updatedAt') }}
                    </span>
                    <span class="font-semibold text-slate-800">{{ formatDate(user.updatedAt) }}</span>
                  </div>
                </div>
              </div>

              <!-- Danger Zone Card -->
              <div class="bg-rose-50/50 rounded-3xl border border-rose-200/80 p-6 shadow-2xs space-y-4">
                <div class="flex items-center gap-2 text-rose-700">
                  <Trash2 class="w-4 h-4" />
                  <h3 class="text-xs font-bold uppercase tracking-wider">{{ t('users.dangerZone') }}</h3>
                </div>

                <p class="text-xs text-rose-600 leading-relaxed">
                  {{ isAr
                    ? 'سيؤدي حذف الحساب إلى إلغاء تفعيل المستخدم بشكل فوري وإلغاء صلاحية الوصول إلى جميع الخدمات.'
                    : 'Deleting the account will immediately deactivate the user and invalidate all access sessions.'
                  }}
                </p>

                <button
                  type="button"
                  @click="handleDeleteUser"
                  :disabled="isDeleting || isOtherAdmin"
                  class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  <RefreshCw v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
                  <Trash2 v-else class="w-3.5 h-3.5" />
                  <span>{{ isDeleting ? t('common.loading') : t('users.deleteUser') }}</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      </DataState>
    </div>
  </AppShell>
</template>
