<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import TableFilterBar from '@/components/data-table/TableFilterBar.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { useFeedback } from '@/composables/useFeedback'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { confirm, toast } = useFeedback()
const { t, locale } = useI18n()
const isAr = computed(() => locale.value === 'ar')

const search = ref('')
const selectedPlan = ref('')
const selectedStatus = ref('')
const currentPage = ref(1)

const filters = computed(() => [
  {
    id: 'plan',
    label: t('users.planCol'),
    value: selectedPlan.value,
    options: [
      { label: t('users.planFree'), value: 'FREE' },
      { label: t('users.planBasic'), value: 'BASIC' },
      { label: t('users.planPro'), value: 'PRO' },
    ]
  },
  {
    id: 'status',
    label: t('users.statusCol'),
    value: selectedStatus.value,
    options: [
      { label: t('common.active'), value: 'Active' },
      { label: t('common.expired'), value: 'Expired' },
      { label: t('common.suspended'), value: 'Suspended' },
    ]
  }
])

const handleFilterChange = (filterId: string, val: string) => {
  if (filterId === 'plan') selectedPlan.value = val
  if (filterId === 'status') selectedStatus.value = val
}

const getPlanLabel = (plan: string) => {
  const upper = (plan || '').toUpperCase()
  if (upper === 'FREE') return t('users.planFree')
  if (upper === 'BASIC') return t('users.planBasic')
  if (upper === 'PRO') return t('users.planPro')
  return plan
}

const getStatusLabel = (status: string) => {
  const s = (status || '').toLowerCase()
  if (s === 'active') return t('common.active')
  if (s === 'expired') return t('common.expired')
  if (s === 'suspended') return t('common.suspended')
  return status
}

interface UserItem {
  id: string
  name: string
  email: string
  phone: string
  role: string
  roleKey: string
  avatar: string
  plan: 'FREE' | 'BASIC' | 'PRO'
  status: 'Active' | 'Expired' | 'Suspended'
  registered: string
}

const users = ref<UserItem[]>([
  {
    id: 'usr-1',
    name: 'Ahmed Mohamed',
    email: 'ahmed@example.com',
    phone: '+20 100 123 4567',
    role: 'Investor',
    roleKey: 'roleInvestor',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    plan: 'PRO',
    status: 'Active',
    registered: 'Sep 28, 2025'
  },
  {
    id: 'usr-2',
    name: 'Sara Ali',
    email: 'sara@example.com',
    phone: '+966 50 234 5678',
    role: 'Trader',
    roleKey: 'roleTrader',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    plan: 'FREE',
    status: 'Active',
    registered: 'Sep 24, 2025'
  },
  {
    id: 'usr-3',
    name: 'Omar Tarek',
    email: 'omar@example.com',
    phone: '+971 52 345 6789',
    role: 'Analyst',
    roleKey: 'roleAnalyst',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    plan: 'PRO',
    status: 'Expired',
    registered: 'Sep 20, 2025'
  },
  {
    id: 'usr-4',
    name: 'Sarah Hassan',
    email: 'sarah@example.com',
    phone: '+20 111 456 7890',
    role: 'Member',
    roleKey: 'roleMember',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    plan: 'BASIC',
    status: 'Active',
    registered: 'Sep 15, 2025'
  },
  {
    id: 'usr-5',
    name: 'Ali Nasser',
    email: 'ali@example.com',
    phone: '+966 55 567 8901',
    role: 'Investor',
    roleKey: 'roleInvestor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    plan: 'BASIC',
    status: 'Active',
    registered: 'Sep 10, 2025'
  }
])

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchesSearch = !search.value || 
      u.name.toLowerCase().includes(search.value.toLowerCase()) || 
      u.email.toLowerCase().includes(search.value.toLowerCase()) ||
      u.phone.includes(search.value) ||
      u.role.toLowerCase().includes(search.value.toLowerCase())
    const matchesPlan = !selectedPlan.value || u.plan === selectedPlan.value
    const matchesStatus = !selectedStatus.value || u.status === selectedStatus.value
    return matchesSearch && matchesPlan && matchesStatus
  })
})

const handleAction = async (actionId: string, u: UserItem) => {
  if (actionId === 'edit' || actionId === 'preview') {
    router.push(`/users/${u.id}`)
  } else if (actionId === 'delete') {
    const ok = await confirm({
      title: isAr.value ? `إيقاف حساب "${u.name}"` : `Suspend Account ("${u.name}")`,
      message: isAr.value
        ? `هل أنت متأكد من رغبتك في إيقاف حساب المستخدم "${u.name}"؟`
        : `Are you sure you want to suspend the account for "${u.name}"?`,
      confirmText: t('users.suspendAccount'),
      cancelText: t('common.cancel'),
      type: 'danger'
    })
    if (ok) {
      u.status = 'Suspended'
      toast.warning(isAr.value ? `تم إيقاف حساب "${u.name}" بنجاح` : `Account "${u.name}" suspended successfully`)
    }
  }
}
</script>

<template>
  <AppShell>
    <div class="flex flex-col max-w-7xl mx-auto">
      <PageHeader
        :title="t('users.title')"
        :description="t('users.subtitle')"
      />

      <!-- Table Box -->
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
        <!-- Filter Bar -->
        <TableFilterBar
          :search-placeholder="t('users.searchPlaceholder')"
          v-model:search-value="search"
          :filters="filters"
          @update:filter="handleFilterChange"
        />

        <!-- Data Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-start text-xs">
            <thead>
              <tr class="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/50">
                <th class="py-3 px-4 text-start">{{ t('users.userCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('users.emailCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('users.roleCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('users.phoneCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('users.planCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('users.statusCol') }}</th>
                <th class="py-3 px-4 text-start">{{ t('users.joinedCol') }}</th>
                <th class="py-3 px-4 text-end">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="u in filteredUsers"
                :key="u.id"
                class="hover:bg-slate-50/60 transition-colors"
              >
                <!-- User Avatar & Name -->
                <td class="py-3 px-4 text-start">
                  <div class="flex items-center gap-2.5">
                    <img
                      :src="u.avatar"
                      :alt="u.name"
                      class="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <span class="font-bold text-slate-900">{{ u.name }}</span>
                  </div>
                </td>

                <!-- Email -->
                <td class="py-3 px-4 text-slate-600 font-medium text-start">{{ u.email }}</td>

                <!-- Role -->
                <td class="py-3 px-4 text-start">
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                    {{ t('users.' + u.roleKey) || u.role }}
                  </span>
                </td>

                <!-- Phone -->
                <td class="py-3 px-4 text-slate-600 font-mono text-[11px] text-start" dir="ltr">
                  {{ u.phone }}
                </td>

                <!-- Plan -->
                <td class="py-3 px-4 text-start">
                  <StatusBadge :status="u.plan" :variant="u.plan === 'PRO' ? 'purple' : u.plan === 'BASIC' ? 'warning' : 'success'">
                    {{ getPlanLabel(u.plan) }}
                  </StatusBadge>
                </td>

                <!-- Status -->
                <td class="py-3 px-4 text-start">
                  <StatusBadge :status="u.status">
                    {{ getStatusLabel(u.status) }}
                  </StatusBadge>
                </td>

                <!-- Registered Date -->
                <td class="py-3 px-4 text-slate-500 font-medium text-start">{{ u.registered }}</td>

                <!-- Actions Menu -->
                <td class="py-3 px-4 text-end">
                  <ActionMenu
                    :items="[
                      { id: 'preview', label: t('common.details') },
                      { id: 'edit', label: t('common.edit') },
                      { id: 'delete', label: t('users.suspendAccount'), danger: true }
                    ]"
                    @select="(act) => handleAction(act, u)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <AppPagination v-model:current-page="currentPage" :total-pages="5" />
      </div>
    </div>
  </AppShell>
</template>
