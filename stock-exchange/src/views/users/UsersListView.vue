<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  UserPlus,
  Search,
  RefreshCw,
  Shield,
  User as UserIcon,
  KeyRound,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Lock,
  X
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import DataState from '@/components/ui/DataState.vue'
import { coreServices } from '@/di'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { UserType, type UserDto } from '@/domain/models/user.model'
import type { CountryDto } from '@/domain/models/country.model'
import type { AppError } from '@/domain/models/common.model'
import { resolveAttachmentUrl, handleImageError, getCleanPhoneInfo } from '@/utils/attachment'

const router = useRouter()
const { confirm, toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const currentAdmin = computed(() => coreServices.tokenStore.getUser())
const isOtherAdmin = (u: UserDto) => u.userType === UserType.Admin && u.id !== currentAdmin.value?.id

const getUserActions = (u: UserDto) => {
  if (isOtherAdmin(u)) {
    return [
      { id: 'preview', label: isAr.value ? 'عرض التفاصيل (قراءة فقط)' : 'View Details (Read-only)', icon: Eye }
    ]
  }
  return [
    { id: 'edit', label: t('common.edit') },
    { id: 'change-password', label: t('users.changePassword'), icon: KeyRound },
    { id: 'delete', label: t('users.deleteUser'), danger: true }
  ]
}

const getCleanPhone = (u: UserDto) => getCleanPhoneInfo(u.phoneNumber, u.countryCode)

// Table State
const users = ref<UserDto[]>([])
const countries = ref<CountryDto[]>([])
const isLoading = ref(true)
const isRefreshing = ref(false)
const errorMessage = ref<string | null>(null)

// Filters & Pagination
const search = ref('')
const selectedRole = ref<string>('')
const selectedStatus = ref<string>('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const totalCount = ref(0)

// Create User Modal State
const isCreateModalOpen = ref(false)
const isSubmittingCreate = ref(false)
const showCreatePassword = ref(false)
const createFormErrors = ref<Record<string, string>>({})
const createForm = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phoneNumber: '',
  countryId: '',
  userType: UserType.Customer,
  isActive: true
})

const selectedCreateCountry = computed(() =>
  countries.value.find(c => c.id === createForm.value.countryId)
)

// Change Password Modal State
const isPasswordModalOpen = ref(false)
const isSubmittingPassword = ref(false)
const showNewPassword = ref(false)
const selectedUserForPassword = ref<UserDto | null>(null)
const passwordFormErrors = ref<Record<string, string>>({})
const passwordForm = ref({
  newPassword: '',
  confirmNewPassword: ''
})

// Fetch Users List
const fetchUsers = async (showLoadingSpinner = true) => {
  if (showLoadingSpinner) {
    isLoading.value = true
  } else {
    isRefreshing.value = true
  }
  errorMessage.value = null

  try {
    const roleValue = selectedRole.value !== '' ? Number(selectedRole.value) : undefined
    const activeValue = selectedStatus.value !== '' ? selectedStatus.value === 'true' : undefined

    const result = await coreServices.users.getAll({
      search: search.value.trim() || undefined,
      userType: roleValue,
      isActive: activeValue,
      pageNumber: currentPage.value,
      pageSize: pageSize.value
    })

    users.value = result.items
    totalPages.value = Math.max(1, result.totalPages)
    totalCount.value = result.totalCount
    currentPage.value = result.pageNumber
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'فشل تحميل بيانات المستخدمين' : 'Failed to load users')
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// Fetch Countries for dropdowns
const fetchCountries = async () => {
  try {
    countries.value = await coreServices.countries.getAll()
  } catch {
    // Non-critical, fallback to empty list
    countries.value = []
  }
}

// Watchers for filters
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchUsers(false)
  }, 350)
})

watch([selectedRole, selectedStatus], () => {
  currentPage.value = 1
  fetchUsers(false)
})

watch(currentPage, () => {
  fetchUsers(true)
})

onMounted(() => {
  fetchUsers(true)
  fetchCountries()
})

// Helpers
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-'
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString(isAr.value ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

const handleAction = async (actionId: string, u: UserDto) => {
  if (actionId === 'edit' || actionId === 'preview') {
    router.push(`/users/${u.id}`)
  } else if (actionId === 'change-password') {
    if (isOtherAdmin(u)) {
      toast.warning(isAr.value ? 'لا يمكن تغيير كلمة مرور مسؤول آخر.' : 'You cannot change the password of another administrator.')
      return
    }
    openChangePasswordModal(u)
  } else if (actionId === 'delete') {
    if (isOtherAdmin(u)) {
      toast.warning(isAr.value ? 'لا يمكن حذف حساب مسؤول آخر.' : 'You cannot delete another administrator account.')
      return
    }
    const ok = await confirm({
      title: isAr.value ? `حذف حساب "${u.fullName}"` : `Delete Account ("${u.fullName}")`,
      message: isAr.value
        ? `هل أنت متأكد من رغبتك في حذف حساب "${u.fullName}"؟ سيتم تعطيل الحساب وإلغاء جميع الجلسات الفعالة.`
        : `Are you sure you want to delete the account for "${u.fullName}"? The account will be deactivated and active sessions revoked.`,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    })

    if (ok) {
      try {
        await coreServices.users.delete(u.id)
        toast.success(isAr.value ? `تم حذف حساب "${u.fullName}" بنجاح` : `Account "${u.fullName}" deleted successfully`)
        fetchUsers(false)
      } catch (err: unknown) {
        const appErr = err as AppError
        toast.error(appErr?.message || (isAr.value ? 'فشل حذف الحساب' : 'Failed to delete account'))
      }
    }
  }
}

// Create User Modal Handlers
const openCreateModal = () => {
  createFormErrors.value = {}
  createForm.value = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    countryId: '',
    userType: UserType.Customer,
    isActive: true
  }
  showCreatePassword.value = false
  isCreateModalOpen.value = true
}

const handleCreateUser = async () => {
  createFormErrors.value = {}
  const f = createForm.value

  // Validation
  if (!f.fullName.trim()) {
    createFormErrors.value.fullName = isAr.value ? 'الاسم الكامل مطلوب' : 'Full name is required'
  }
  if (!f.email.trim()) {
    createFormErrors.value.email = isAr.value ? 'البريد الإلكتروني مطلوب' : 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
    createFormErrors.value.email = isAr.value ? 'البريد الإلكتروني غير صالح' : 'Invalid email format'
  }
  if (!f.password) {
    createFormErrors.value.password = isAr.value ? 'كلمة المرور مطلوبة' : 'Password is required'
  } else if (f.password.length < 6) {
    createFormErrors.value.password = isAr.value ? 'يجب ألا تقل كلمة المرور عن 6 أحرف' : 'Password must be at least 6 characters'
  }
  if (f.password !== f.confirmPassword) {
    createFormErrors.value.confirmPassword = isAr.value ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'
  }

  if (Object.keys(createFormErrors.value).length > 0) return

  isSubmittingCreate.value = true
  try {
    const country = selectedCreateCountry.value
    const cleanPhone = f.phoneNumber.trim()
      ? getCleanPhoneInfo(f.phoneNumber, country?.code).cleanNumber
      : null

    await coreServices.users.create({
      fullName: f.fullName.trim(),
      email: f.email.trim(),
      password: f.password,
      confirmPassword: f.confirmPassword,
      phoneNumber: cleanPhone,
      countryId: f.countryId || null,
      userType: f.userType,
      isActive: f.isActive
    })

    toast.success(isAr.value ? 'تم إنشاء المستخدم بنجاح' : 'User created successfully')
    isCreateModalOpen.value = false
    fetchUsers(false)
  } catch (err: unknown) {
    const appErr = err as AppError
    if (appErr.fieldErrors) {
      createFormErrors.value = appErr.fieldErrors
    }
    toast.error(appErr?.message || (isAr.value ? 'فشل إنشاء المستخدم' : 'Failed to create user'))
  } finally {
    isSubmittingCreate.value = false
  }
}

// Change Password Modal Handlers
const openChangePasswordModal = (u: UserDto) => {
  selectedUserForPassword.value = u
  passwordFormErrors.value = {}
  passwordForm.value = {
    newPassword: '',
    confirmNewPassword: ''
  }
  showNewPassword.value = false
  isPasswordModalOpen.value = true
}

const handleChangePassword = async () => {
  passwordFormErrors.value = {}
  const target = selectedUserForPassword.value
  if (!target) return

  const p = passwordForm.value
  if (!p.newPassword) {
    passwordFormErrors.value.newPassword = isAr.value ? 'يرجى إدخال كلمة المرور الجديدة' : 'New password is required'
  } else if (p.newPassword.length < 6) {
    passwordFormErrors.value.newPassword = isAr.value ? 'يجب ألا تقل كلمة المرور عن 6 أحرف' : 'Password must be at least 6 characters'
  }
  if (p.newPassword !== p.confirmNewPassword) {
    passwordFormErrors.value.confirmNewPassword = isAr.value ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'
  }

  if (Object.keys(passwordFormErrors.value).length > 0) return

  isSubmittingPassword.value = true
  try {
    await coreServices.users.changePassword(target.id, {
      newPassword: p.newPassword,
      confirmNewPassword: p.confirmNewPassword
    })

    toast.success(isAr.value ? `تم تحديث كلمة المرور للمستخدم "${target.fullName}" بنجاح` : `Password updated for "${target.fullName}" successfully`)
    isPasswordModalOpen.value = false
  } catch (err: unknown) {
    const appErr = err as AppError
    if (appErr.fieldErrors) {
      passwordFormErrors.value = appErr.fieldErrors
    }
    toast.error(appErr?.message || (isAr.value ? 'فشل تحديث كلمة المرور' : 'Failed to update password'))
  } finally {
    isSubmittingPassword.value = false
  }
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto space-y-6">
      <!-- Page Header -->
      <PageHeader
        :title="t('users.title')"
        :description="t('users.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            @click="fetchUsers(false)"
            :disabled="isRefreshing || isLoading"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            :title="t('common.refresh')"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
            <span class="hidden sm:inline">{{ t('common.refresh') }}</span>
          </button>

          <button
            type="button"
            @click="openCreateModal"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <UserPlus class="w-4 h-4" />
            <span>{{ t('users.addUser') }}</span>
          </button>
        </template>
      </PageHeader>

      <!-- Main Content Card -->
      <div class="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs">
        
        <!-- Filters & Search Toolbar -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          <!-- Search Bar -->
          <div class="relative w-full sm:max-w-md">
            <Search class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              v-model="search"
              :placeholder="t('users.searchPlaceholder')"
              class="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl ps-10 pe-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-2xs"
            />
            <button
              v-if="search"
              @click="search = ''"
              type="button"
              class="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Dropdown Filters -->
          <div class="flex items-center gap-2.5 flex-wrap">
            <!-- Role Filter -->
            <div class="relative min-w-[130px] flex-1 sm:flex-initial">
              <select
                v-model="selectedRole"
                class="w-full bg-slate-50/70 border border-slate-200/80 rounded-xl ps-3.5 pe-8 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 shadow-2xs cursor-pointer appearance-none"
              >
                <option value="">{{ t('users.allRoles') }}</option>
                <option :value="String(UserType.Customer)">{{ t('users.roleCustomer') }}</option>
                <option :value="String(UserType.Admin)">{{ t('users.roleAdmin') }}</option>
              </select>
              <div class="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            <!-- Status Filter -->
            <div class="relative min-w-[130px] flex-1 sm:flex-initial">
              <select
                v-model="selectedStatus"
                class="w-full bg-slate-50/70 border border-slate-200/80 rounded-xl ps-3.5 pe-8 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 shadow-2xs cursor-pointer appearance-none"
              >
                <option value="">{{ t('users.allStatuses') }}</option>
                <option value="true">{{ t('users.statusActive') }}</option>
                <option value="false">{{ t('users.statusInactive') }}</option>
              </select>
              <div class="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            <!-- Reset Filters if active -->
            <button
              v-if="search || selectedRole !== '' || selectedStatus !== ''"
              @click="search = ''; selectedRole = ''; selectedStatus = ''"
              type="button"
              class="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              {{ t('common.clear') }}
            </button>
          </div>
        </div>

        <!-- Data State / Table Area -->
        <DataState
          :loading="isLoading"
          :error="errorMessage"
          :empty="!isLoading && users.length === 0"
          :empty-title="t('users.noUsersFound')"
          :empty-message="t('users.noUsersFoundDesc')"
          @retry="fetchUsers(true)"
        >
          <template #empty-action>
            <button
              type="button"
              @click="openCreateModal"
              class="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <UserPlus class="w-4 h-4" />
              <span>{{ t('users.addUser') }}</span>
            </button>
          </template>

          <!-- Table Container -->
          <div class="overflow-x-auto rounded-2xl border border-slate-100">
            <table class="w-full text-start text-xs min-w-[760px]">
              <thead>
                <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/70 whitespace-nowrap">
                  <th class="py-3 px-4 text-start whitespace-nowrap">{{ t('users.userCol') }}</th>
                  <th class="py-3 px-4 text-start whitespace-nowrap">{{ t('users.emailCol') }}</th>
                  <th class="py-3 px-4 text-start whitespace-nowrap">{{ t('users.roleCol') }}</th>
                  <th class="py-3 px-4 text-start whitespace-nowrap">{{ t('users.phoneCol') }}</th>
                  <th class="py-3 px-4 text-start whitespace-nowrap">{{ t('users.statusCol') }}</th>
                  <th class="py-3 px-4 text-start whitespace-nowrap">{{ t('users.joinedCol') }}</th>
                  <th class="py-3 px-4 text-end whitespace-nowrap">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="u in users"
                  :key="u.id"
                  class="hover:bg-slate-50/70 transition-colors group"
                >
                  <!-- User Avatar & Full Name -->
                  <td class="py-3.5 px-4 text-start whitespace-nowrap">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                        <img
                          :src="resolveAttachmentUrl(u.profilePictureUrl, 'avatar')"
                          @error="handleImageError($event, 'avatar')"
                          :alt="u.fullName"
                          class="w-full h-full object-cover"
                        />
                      </div>

                      <div class="flex flex-col min-w-0">
                        <span class="font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors whitespace-nowrap">
                          {{ u.fullName }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Email Address -->
                  <td class="py-3.5 px-4 text-slate-600 font-medium text-start whitespace-nowrap">
                    {{ u.email }}
                  </td>

                  <!-- Role Badge -->
                  <td class="py-3.5 px-4 text-start whitespace-nowrap">
                    <span
                      v-if="u.userType === UserType.Admin"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px]"
                    >
                      <Shield class="w-3.5 h-3.5 text-indigo-600" />
                      <span>{{ isAr ? (u.userTypeArabic || 'مدير') : (u.userTypeEnglish || 'Admin') }}</span>
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]"
                    >
                      <UserIcon class="w-3.5 h-3.5 text-slate-500" />
                      <span>{{ isAr ? (u.userTypeArabic || 'عميل') : (u.userTypeEnglish || 'Customer') }}</span>
                    </span>
                  </td>

                  <!-- Phone Number & Code (Strictly single-line / whitespace-nowrap) -->
                  <td class="py-3.5 px-4 text-start whitespace-nowrap" dir="ltr">
                    <div v-if="getCleanPhone(u).hasPhone" class="inline-flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap flex-nowrap shrink-0">
                      <span
                        v-if="getCleanPhone(u).code"
                        class="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80 text-[10px] whitespace-nowrap shrink-0"
                      >
                        {{ getCleanPhone(u).code }}
                      </span>
                      <span class="text-slate-700 font-semibold tracking-wide whitespace-nowrap inline-block shrink-0">
                        {{ getCleanPhone(u).cleanNumber }}
                      </span>
                    </div>
                    <span v-else class="text-slate-400 font-medium text-xs whitespace-nowrap">-</span>
                  </td>

                  <!-- Status -->
                  <td class="py-3.5 px-4 text-start whitespace-nowrap">
                    <StatusBadge :status="u.isActive ? 'ACTIVE' : 'INACTIVE'">
                      {{ u.isActive ? (isAr ? (u.statusArabic || 'نشط') : 'Active') : (isAr ? (u.statusArabic || 'غير نشط') : 'Inactive') }}
                    </StatusBadge>
                  </td>

                  <!-- Created At -->
                  <td class="py-3.5 px-4 text-slate-500 font-medium text-start whitespace-nowrap">
                    {{ formatDate(u.createdAt) }}
                  </td>

                  <!-- Actions Menu -->
                  <td class="py-3.5 px-4 text-end">
                    <ActionMenu
                      :items="getUserActions(u)"
                      @select="(act) => handleAction(act, u)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div class="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <span class="text-xs text-slate-500 font-medium">
              {{ isAr ? `إجمالي المستخدمين: ${totalCount}` : `Total Users: ${totalCount}` }}
            </span>
            <AppPagination
              v-model:current-page="currentPage"
              :total-pages="totalPages"
            />
          </div>
        </DataState>
      </div>

      <!-- Add New User Modal -->
      <div
        v-if="isCreateModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        @click.self="isCreateModalOpen = false"
      >
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <UserPlus class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900">{{ t('users.createNewUser') }}</h3>
                <p class="text-xs text-slate-500">{{ isAr ? 'أدخل بيانات الحساب الجديد بالكامل' : 'Enter user account credentials' }}</p>
              </div>
            </div>
            <button
              type="button"
              @click="isCreateModalOpen = false"
              class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="handleCreateUser" class="space-y-4">
            <!-- Full Name -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('users.fullName') }} <span class="text-rose-500">*</span></label>
              <input
                type="text"
                v-model="createForm.fullName"
                :placeholder="isAr ? 'مثال: محمد أحمد' : 'e.g. John Doe'"
                class="w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                :class="{ 'border-rose-400 bg-rose-50/30': createFormErrors.fullName }"
              />
              <span v-if="createFormErrors.fullName" class="text-[11px] text-rose-500 font-medium block">
                {{ createFormErrors.fullName }}
              </span>
            </div>

            <!-- Email -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('users.email') }} <span class="text-rose-500">*</span></label>
              <div class="relative">
                <Mail class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  v-model="createForm.email"
                  placeholder="user@example.com"
                  dir="ltr"
                  class="w-full bg-slate-50 border rounded-xl ps-10 pe-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  :class="{ 'border-rose-400 bg-rose-50/30': createFormErrors.email }"
                />
              </div>
              <span v-if="createFormErrors.email" class="text-[11px] text-rose-500 font-medium block">
                {{ createFormErrors.email }}
              </span>
            </div>

            <!-- Password & Confirm Password -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-700">{{ t('auth.password') }} <span class="text-rose-500">*</span></label>
                <div class="relative">
                  <Lock class="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    :type="showCreatePassword ? 'text' : 'password'"
                    v-model="createForm.password"
                    dir="ltr"
                    placeholder="••••••••"
                    class="w-full bg-slate-50 border rounded-xl ps-9 pe-9 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    :class="{ 'border-rose-400 bg-rose-50/30': createFormErrors.password }"
                  />
                  <button
                    type="button"
                    @click="showCreatePassword = !showCreatePassword"
                    class="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <EyeOff v-if="showCreatePassword" class="w-3.5 h-3.5" />
                    <Eye v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
                <span v-if="createFormErrors.password" class="text-[10px] text-rose-500 font-medium block">
                  {{ createFormErrors.password }}
                </span>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-700">{{ t('auth.confirmPassword') }} <span class="text-rose-500">*</span></label>
                <div class="relative">
                  <Lock class="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    :type="showCreatePassword ? 'text' : 'password'"
                    v-model="createForm.confirmPassword"
                    dir="ltr"
                    placeholder="••••••••"
                    class="w-full bg-slate-50 border rounded-xl ps-9 pe-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    :class="{ 'border-rose-400 bg-rose-50/30': createFormErrors.confirmPassword }"
                  />
                </div>
                <span v-if="createFormErrors.confirmPassword" class="text-[10px] text-rose-500 font-medium block">
                  {{ createFormErrors.confirmPassword }}
                </span>
              </div>
            </div>

            <!-- Phone & Country -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-700">{{ t('users.phoneNumber') }}</label>
                <div class="relative flex items-center">
                  <span
                    v-if="selectedCreateCountry?.code"
                    class="absolute start-3 z-10 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[11px] font-mono select-none"
                  >
                    {{ selectedCreateCountry.code }}
                  </span>
                  <Phone v-else class="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    v-model="createForm.phoneNumber"
                    :placeholder="isAr ? 'مثال: 100 123 4567' : 'e.g. 100 123 4567'"
                    dir="ltr"
                    class="w-full bg-slate-50 border rounded-xl pe-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all font-mono"
                    :class="selectedCreateCountry?.code ? 'ps-18' : 'ps-9'"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-700">{{ t('users.country') }}</label>
                <select
                  v-model="createForm.countryId"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
                >
                  <option value="">{{ t('users.selectCountry') }}</option>
                  <option v-for="c in countries" :key="c.id" :value="c.id">
                    {{ isAr ? c.countryArName : c.countryEnName }} ({{ c.code }})
                  </option>
                </select>
              </div>
            </div>

            <!-- Role & Status -->
            <div class="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Role Option -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-700">{{ t('users.roleCol') }}</label>
                <div class="flex items-center gap-3">
                  <label class="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="radio"
                      :value="UserType.Customer"
                      v-model="createForm.userType"
                      class="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{{ t('users.roleCustomer') }}</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="radio"
                      :value="UserType.Admin"
                      v-model="createForm.userType"
                      class="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span class="text-indigo-600 font-bold">{{ t('users.roleAdmin') }}</span>
                  </label>
                </div>
              </div>

              <!-- Active Toggle -->
              <div class="flex items-center justify-between sm:justify-start gap-3 pt-4 sm:pt-6">
                <input
                  type="checkbox"
                  id="createIsActive"
                  v-model="createForm.isActive"
                  class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label for="createIsActive" class="text-xs font-bold text-slate-800 cursor-pointer select-none">
                  {{ t('users.accountActive') }}
                </label>
              </div>
            </div>

            <!-- Footer Modal Buttons -->
            <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                @click="isCreateModalOpen = false"
                class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="isSubmittingCreate"
                class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                <RefreshCw v-if="isSubmittingCreate" class="w-3.5 h-3.5 animate-spin" />
                <span>{{ isSubmittingCreate ? t('common.loading') : t('users.addUser') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Change Password Modal -->
      <div
        v-if="isPasswordModalOpen && selectedUserForPassword"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        @click.self="isPasswordModalOpen = false"
      >
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <KeyRound class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900">{{ t('users.changePasswordTitle') }}</h3>
                <p class="text-[11px] text-slate-500">{{ selectedUserForPassword.fullName }} ({{ selectedUserForPassword.email }})</p>
              </div>
            </div>
            <button
              type="button"
              @click="isPasswordModalOpen = false"
              class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="handleChangePassword" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('users.newPassword') }} <span class="text-rose-500">*</span></label>
              <div class="relative">
                <Lock class="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  :type="showNewPassword ? 'text' : 'password'"
                  v-model="passwordForm.newPassword"
                  dir="ltr"
                  placeholder="••••••••"
                  class="w-full bg-slate-50 border rounded-xl ps-9 pe-9 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 transition-all"
                  :class="{ 'border-rose-400 bg-rose-50/30': passwordFormErrors.newPassword }"
                />
                <button
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <EyeOff v-if="showNewPassword" class="w-3.5 h-3.5" />
                  <Eye v-else class="w-3.5 h-3.5" />
                </button>
              </div>
              <span v-if="passwordFormErrors.newPassword" class="text-[10px] text-rose-500 font-medium block">
                {{ passwordFormErrors.newPassword }}
              </span>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700">{{ t('users.confirmNewPassword') }} <span class="text-rose-500">*</span></label>
              <div class="relative">
                <Lock class="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  :type="showNewPassword ? 'text' : 'password'"
                  v-model="passwordForm.confirmNewPassword"
                  dir="ltr"
                  placeholder="••••••••"
                  class="w-full bg-slate-50 border rounded-xl ps-9 pe-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 transition-all"
                  :class="{ 'border-rose-400 bg-rose-50/30': passwordFormErrors.confirmNewPassword }"
                />
              </div>
              <span v-if="passwordFormErrors.confirmNewPassword" class="text-[10px] text-rose-500 font-medium block">
                {{ passwordFormErrors.confirmNewPassword }}
              </span>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                @click="isPasswordModalOpen = false"
                class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="isSubmittingPassword"
                class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                <RefreshCw v-if="isSubmittingPassword" class="w-3.5 h-3.5 animate-spin" />
                <span>{{ isSubmittingPassword ? t('common.loading') : t('users.changePassword') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  </AppShell>
</template>
