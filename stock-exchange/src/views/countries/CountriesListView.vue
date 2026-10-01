<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import DataState from '@/components/ui/DataState.vue'
import {
  Globe,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Check,
  Phone,
  Languages,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Building2,
  RefreshCw
} from 'lucide-vue-next'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'
import { coreServices } from '@/di'
import type { CountryDto, GetCountriesPaginatedParams } from '@/domain/models/country.model'
import type { AppError } from '@/domain/models/common.model'

const { toast, confirm } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

// State
const countries = ref<CountryDto[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

// Search & Filter State
const searchQuery = ref('')
const selectedStatus = ref<'All' | 'Active' | 'Inactive'>('All')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalCount = ref(0)
const totalPages = ref(1)

// Metrics
const activeCount = computed(() => countries.value.filter(c => c.isActive !== false).length)
const totalUsers = computed(() => countries.value.reduce((acc, c) => acc + (c.usersCount || 0), 0))

// Fetch Paginated Countries
const fetchCountries = async (showLoading = true) => {
  if (showLoading) isLoading.value = true
  errorMessage.value = null

  try {
    const params: GetCountriesPaginatedParams = {
      pageNumber: currentPage.value,
      pageSize: itemsPerPage.value,
      searchTerm: searchQuery.value.trim() || undefined,
      isActive: selectedStatus.value === 'All' ? undefined : selectedStatus.value === 'Active'
    }

    const response = await coreServices.countries.getAllPaginated(params)
    countries.value = response.items || []
    totalCount.value = response.totalCount || 0
    totalPages.value = response.totalPages || 1
  } catch (err: unknown) {
    const appErr = err as AppError
    errorMessage.value = appErr?.message || (isAr.value ? 'تعذر تحميل قائمة الدول' : 'Failed to load countries')
    toast.error(errorMessage.value)
  } finally {
    if (showLoading) isLoading.value = false
  }
}

// Watchers
let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchCountries()
  }, 350)
})

watch(selectedStatus, () => {
  currentPage.value = 1
  fetchCountries()
})

watch(currentPage, () => {
  fetchCountries()
})

onMounted(() => {
  fetchCountries()
})

// Modal State
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const formData = ref<{
  id?: string
  countryEnName: string
  countryArName: string
  code: string
  isActive: boolean
}>({
  countryEnName: '',
  countryArName: '',
  code: '+',
  isActive: true
})

const formErrors = ref<Record<string, string>>({})

const openCreateModal = () => {
  modalMode.value = 'create'
  formData.value = {
    countryEnName: '',
    countryArName: '',
    code: '+',
    isActive: true
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const openEditModal = (country: CountryDto) => {
  modalMode.value = 'edit'
  formData.value = {
    id: country.id,
    countryEnName: country.countryEnName,
    countryArName: country.countryArName,
    code: country.code,
    isActive: country.isActive ?? true
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const validateForm = () => {
  const errors: Record<string, string> = {}

  if (!formData.value.countryEnName.trim()) {
    errors.countryEnName = isAr.value ? 'الاسم باللغة الإنجليزية مطلوب' : 'English name is required'
  }

  if (!formData.value.countryArName.trim()) {
    errors.countryArName = isAr.value ? 'الاسم باللغة العربية مطلوب' : 'Arabic name is required'
  }

  const cleanCode = formData.value.code.trim()
  if (!cleanCode || cleanCode === '+') {
    errors.code = isAr.value ? 'رمز الاتصال الدولي مطلوب (مثال: +20)' : 'International phone code is required (e.g. +20)'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSaveCountry = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  const cleanCode = formData.value.code.trim().startsWith('+')
    ? formData.value.code.trim()
    : `+${formData.value.code.trim()}`

  try {
    if (modalMode.value === 'create') {
      await coreServices.countries.create({
        countryEnName: formData.value.countryEnName.trim(),
        countryArName: formData.value.countryArName.trim(),
        code: cleanCode,
        isActive: formData.value.isActive
      })
      toast.success(
        isAr.value
          ? `تمت إضافة الدولة "${formData.value.countryArName}" بنجاح!`
          : `Country "${formData.value.countryEnName}" added successfully!`
      )
    } else if (formData.value.id) {
      await coreServices.countries.update(formData.value.id, {
        countryEnName: formData.value.countryEnName.trim(),
        countryArName: formData.value.countryArName.trim(),
        code: cleanCode,
        isActive: formData.value.isActive
      })
      toast.success(
        isAr.value
          ? `تم تحديث بيانات الدولة "${formData.value.countryArName}" بنجاح!`
          : `Country "${formData.value.countryEnName}" updated successfully!`
      )
    }

    closeModal()
    fetchCountries(false)
  } catch (err: unknown) {
    const appErr = err as AppError
    if (appErr.fieldErrors) {
      formErrors.value = appErr.fieldErrors
    }
    toast.error(appErr?.message || (isAr.value ? 'فشل حفظ بيانات الدولة' : 'Failed to save country'))
  } finally {
    isSubmitting.value = false
  }
}

const toggleStatus = async (country: CountryDto) => {
  const newStatus = !(country.isActive ?? true)
  try {
    await coreServices.countries.update(country.id, {
      countryEnName: country.countryEnName,
      countryArName: country.countryArName,
      code: country.code,
      isActive: newStatus
    })
    country.isActive = newStatus
    const statusLabel = newStatus ? t('common.active') : t('common.inactive')
    toast.info(isAr.value ? `حالة ${country.countryArName} الآن: ${statusLabel}` : `${country.countryEnName} is now ${statusLabel}`)
  } catch (err: unknown) {
    const appErr = err as AppError
    toast.error(appErr?.message || (isAr.value ? 'فشل تغيير حالة الدولة' : 'Failed to toggle country status'))
  }
}

const handleDeleteCountry = async (country: CountryDto) => {
  const countryName = isAr.value ? (country.countryArName || country.countryEnName) : country.countryEnName
  const confirmed = await confirm({
    title: isAr.value ? `${t('countries.deleteConfirmTitle')} "${countryName}"` : `${t('countries.deleteConfirmTitle')} "${countryName}"?`,
    message: isAr.value
      ? `${t('countries.deleteConfirmDesc')} (${country.countryArName} / ${country.countryEnName})`
      : `${t('countries.deleteConfirmDesc')} (${country.countryEnName} / ${country.countryArName})`,
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
    type: 'danger'
  })

  if (confirmed) {
    try {
      await coreServices.countries.delete(country.id)
      toast.success(
        isAr.value ? `تم حذف دولة "${countryName}" بنجاح` : `Country "${countryName}" was deleted successfully`
      )
      fetchCountries(false)
    } catch (err: unknown) {
      const appErr = err as AppError
      toast.error(appErr?.message || (isAr.value ? 'فشل حذف الدولة' : 'Failed to delete country'))
    }
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = 'All'
  currentPage.value = 1
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col gap-6 max-w-7xl mx-auto">
      <!-- Page Header -->
      <PageHeader
        :title="t('countries.title')"
        :description="t('countries.subtitle')"
      >
        <template #actions>
          <button
            type="button"
            @click="openCreateModal"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>{{ t('countries.addCountry') }}</span>
          </button>
        </template>
      </PageHeader>

      <!-- Stat Badges -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Globe class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('countries.totalCountries') }}</div>
            <div class="text-lg font-black text-slate-900">{{ totalCount }}</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('countries.activeJurisdictions') }}</div>
            <div class="text-lg font-black text-teal-600">{{ activeCount }}</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ t('countries.registeredTraders') }}</div>
            <div class="text-lg font-black text-blue-600">{{ totalUsers.toLocaleString() }}</div>
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div class="relative w-full md:w-80">
          <Search class="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('countries.searchPlaceholder')"
            class="w-full bg-slate-50/80 border border-slate-200 rounded-xl ps-10 pe-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div class="flex items-center gap-2.5 w-full md:w-auto">
          <!-- Status Filter -->
          <select
            v-model="selectedStatus"
            class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All">{{ t('common.all') }} {{ t('countries.status') }}</option>
            <option value="Active">{{ t('common.active') }}</option>
            <option value="Inactive">{{ t('common.inactive') }}</option>
          </select>

          <button
            v-if="searchQuery || selectedStatus !== 'All'"
            type="button"
            @click="clearFilters"
            class="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-1 transition-colors cursor-pointer shrink-0"
          >
            {{ t('common.clear') }}
          </button>
        </div>
      </div>

      <!-- Country Table Container with DataState -->
      <DataState
        :loading="isLoading"
        :error="errorMessage"
        @retry="fetchCountries"
      >
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-start text-xs min-w-[650px]">
              <thead>
                <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/50">
                  <th class="py-3 px-5 text-start">{{ t('countries.enName') }}</th>
                  <th class="py-3 px-5 text-start">{{ t('countries.arName') }}</th>
                  <th class="py-3 px-5 text-start">{{ t('countries.phoneCode') }}</th>
                  <th class="py-3 px-5 text-start">{{ t('countries.status') }}</th>
                  <th class="py-3 px-5 text-start">{{ t('countries.users') }}</th>
                  <th class="py-3 px-5 text-end">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="country in countries"
                  :key="country.id"
                  class="hover:bg-slate-50/70 transition-colors group"
                >
                  <!-- English Name -->
                  <td class="py-3.5 px-5 text-start">
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <Globe class="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span class="font-bold text-slate-900 text-xs">{{ country.countryEnName }}</span>
                    </div>
                  </td>

                  <!-- Arabic Name -->
                  <td class="py-3.5 px-5 text-start" dir="rtl">
                    <span class="font-bold text-slate-900 text-xs block text-start">{{ country.countryArName }}</span>
                  </td>

                  <!-- Phone Code -->
                  <td class="py-3.5 px-5 text-start">
                    <div class="flex items-center gap-1.5 font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 w-fit px-2 py-0.5 rounded-md" dir="ltr">
                      <Phone class="w-3 h-3 text-emerald-600" />
                      <span>{{ country.code }}</span>
                    </div>
                  </td>

                  <!-- Status -->
                  <td class="py-3.5 px-5 text-start">
                    <button
                      type="button"
                      @click="toggleStatus(country)"
                      class="cursor-pointer transition-opacity hover:opacity-80"
                      title="Click to toggle status"
                    >
                      <StatusBadge :status="country.isActive ? 'ACTIVE' : 'INACTIVE'">
                        {{ country.isActive ? t('common.active') : t('common.inactive') }}
                      </StatusBadge>
                    </button>
                  </td>

                  <!-- User Count -->
                  <td class="py-3.5 px-5 text-start">
                    <span class="font-semibold text-slate-700 font-mono">{{ (country.usersCount || 0).toLocaleString() }}</span>
                  </td>

                  <!-- Actions -->
                  <td class="py-3.5 px-5 text-end">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        @click="openEditModal(country)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        :title="t('countries.editCountry')"
                      >
                        <Edit3 class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        @click="handleDeleteCountry(country)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        :title="t('common.delete')"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="countries.length === 0">
                  <td colspan="6" class="py-12 text-center text-slate-400">
                    <Globe class="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p class="font-bold text-slate-700 text-sm">{{ isAr ? 'لا توجد دول مضافة' : 'No countries found' }}</p>
                    <p class="text-xs text-slate-400 mt-0.5 mb-4">{{ isAr ? 'جرّب البحث بكلمة أخرى أو قم بإضافة دولة جديدة.' : 'Try a different search keyword or add a new country.' }}</p>
                    <button
                      type="button"
                      @click="openCreateModal"
                      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus class="w-4 h-4" />
                      <span>{{ t('countries.addCountry') }}</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span class="text-xs font-medium text-slate-500">
              {{ isAr ? `عرض ${countries.length} من إجمالي ${totalCount} دولة` : `Showing ${countries.length} of ${totalCount} countries` }}
            </span>
            <AppPagination
              v-model:current-page="currentPage"
              :total-pages="totalPages"
            />
          </div>
        </div>
      </DataState>
    </div>

    <!-- Create / Edit Country Modal -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Globe class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  {{ modalMode === 'create' ? t('countries.addNewCountry') : t('countries.editCountry') }}
                </h3>
                <span class="text-[10px] text-slate-400">{{ t('countries.subtitle') }}</span>
              </div>
            </div>
            <button
              type="button"
              @click="closeModal"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSaveCountry" class="p-6 flex flex-col gap-4 text-xs">
            <!-- English Name -->
            <div class="flex flex-col gap-1">
              <label class="font-bold text-slate-700 flex items-center gap-1">
                <Languages class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ t('countries.enName') }} *</span>
              </label>
              <input
                v-model="formData.countryEnName"
                type="text"
                placeholder="e.g. Egypt, Saudi Arabia"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                :class="{ 'border-rose-400 bg-rose-50/30': formErrors.countryEnName }"
              />
              <span v-if="formErrors.countryEnName" class="text-rose-500 text-[10px] font-bold">{{ formErrors.countryEnName }}</span>
            </div>

            <!-- Arabic Name -->
            <div class="flex flex-col gap-1">
              <label class="font-bold text-slate-700 flex items-center gap-1">
                <Languages class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ t('countries.arName') }} *</span>
              </label>
              <input
                v-model="formData.countryArName"
                type="text"
                dir="rtl"
                placeholder="مثلاً: مصر، المملكة العربية السعودية"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 text-start font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                :class="{ 'border-rose-400 bg-rose-50/30': formErrors.countryArName }"
              />
              <span v-if="formErrors.countryArName" class="text-rose-500 text-[10px] font-bold">{{ formErrors.countryArName }}</span>
            </div>

            <!-- Phone Code -->
            <div class="flex flex-col gap-1">
              <label class="font-bold text-slate-700 flex items-center gap-1">
                <Phone class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ t('countries.phoneCode') }} *</span>
              </label>
              <input
                v-model="formData.code"
                type="text"
                dir="ltr"
                placeholder="e.g. +20, +966, +971"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                :class="{ 'border-rose-400 bg-rose-50/30': formErrors.code }"
              />
              <span v-if="formErrors.code" class="text-rose-500 text-[10px] font-bold">{{ formErrors.code }}</span>
            </div>

            <!-- Status Switch -->
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span class="font-bold text-slate-800 block">{{ t('countries.activeStatus') }}</span>
                <span class="text-[10px] text-slate-400">{{ t('countries.activeStatusDesc') }}</span>
              </div>
              <button
                type="button"
                @click="formData.isActive = !formData.isActive"
                class="cursor-pointer"
              >
                <ToggleRight v-if="formData.isActive" class="w-7 h-7 text-emerald-600" />
                <ToggleLeft v-else class="w-7 h-7 text-slate-400" />
              </button>
            </div>

            <!-- Modal Actions -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                @click="closeModal"
                :disabled="isSubmitting"
                class="px-4 py-2 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 cursor-pointer shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
                <Check v-else class="w-3.5 h-3.5" />
                <span>{{ modalMode === 'create' ? t('countries.saveCountry') : t('countries.updateCountry') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </AppShell>
</template>
