import { ref, computed } from 'vue'

export type PlanTier = 'FREE' | 'BASIC' | 'PRO'

export type FeatureCategory = 'news' | 'articles' | 'videos'

export interface FeaturePermission {
  id: string
  key: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  category: FeatureCategory
  categoryName: string
  categoryNameAr: string
  plans: Record<PlanTier, boolean>
}

const STORAGE_KEY = 'finwise_plan_permissions_v10'

const defaultPermissions: FeaturePermission[] = [
  // ── FREE+ ────────────────────────────────────────────────────────────────
  // 1. Daily Market News — available to everyone
  {
    id: 'daily_market_news',
    key: 'dailyMarketNews',
    name: 'Daily Market News',
    nameAr: 'أخبار السوق اليومية',
    description: 'Breaking news, corporate disclosures, and daily financial bulletins',
    descriptionAr: 'الأخبار العاجلة وإفصاحات الشركات والنشرات المالية اليومية',
    category: 'news',
    categoryName: 'Market News',
    categoryNameAr: 'أخبار السوق',
    plans: { FREE: true, BASIC: true, PRO: true }
  },

  // ── BASIC ─────────────────────────────────────────────────────────────────
  // 2. Limited Articles — Basic only (Pro gets unlimited instead)
  {
    id: 'limited_articles',
    key: 'limitedArticles',
    name: 'Limited Articles',
    nameAr: 'مقالات محدودة',
    description: 'Access to a curated selection of educational articles and investment guides',
    descriptionAr: 'الوصول لمجموعة مختارة من المقالات التعليمية وأدلة الاستثمار',
    category: 'articles',
    categoryName: 'Articles & Guides',
    categoryNameAr: 'المقالات والأدلة',
    plans: { FREE: false, BASIC: true, PRO: false }
  },

  // 3. Limited Videos — Basic only (Pro gets unlimited instead)
  {
    id: 'limited_videos',
    key: 'limitedVideos',
    name: 'Limited Video Courses',
    nameAr: 'فيديوهات محدودة',
    description: 'Access to a selection of beginner video lessons on trading and investing',
    descriptionAr: 'الوصول لمجموعة مختارة من دروس الفيديو للمبتدئين في التداول والاستثمار',
    category: 'videos',
    categoryName: 'Video Courses',
    categoryNameAr: 'دورات الفيديو',
    plans: { FREE: false, BASIC: true, PRO: false }
  },

  // ── PRO ───────────────────────────────────────────────────────────────────
  // 4. Unlimited Articles — Pro only
  {
    id: 'unlimited_articles',
    key: 'unlimitedArticles',
    name: 'Unlimited Articles',
    nameAr: 'مقالات لانهائية',
    description: 'Unlimited access to all articles, in-depth market analysis, and research reports',
    descriptionAr: 'وصول غير محدود لجميع المقالات والتحليلات المعمقة للسوق والتقارير البحثية',
    category: 'articles',
    categoryName: 'Articles & Guides',
    categoryNameAr: 'المقالات والأدلة',
    plans: { FREE: false, BASIC: false, PRO: true }
  },

  // 5. Unlimited Videos — Pro only
  {
    id: 'unlimited_videos',
    key: 'unlimitedVideos',
    name: 'Unlimited Video Courses',
    nameAr: 'فيديوهات لانهائية',
    description: 'Unlimited access to all expert video courses, live sessions, and masterclasses',
    descriptionAr: 'وصول غير محدود لجميع دورات الفيديو من الخبراء والجلسات الحية والـ masterclasses',
    category: 'videos',
    categoryName: 'Video Courses',
    categoryNameAr: 'دورات الفيديو',
    plans: { FREE: false, BASIC: false, PRO: true }
  }
]

// Global reactive state shared across all components
const permissions = ref<FeaturePermission[]>(loadStoredPermissions())

function loadStoredPermissions(): FeaturePermission[] {
  if (typeof window !== 'undefined') {
    for (let i = 1; i <= 9; i++) {
      localStorage.removeItem(`finwise_plan_permissions_v${i}`)
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return defaultPermissions.map((def) => {
            const found = (parsed as Partial<FeaturePermission>[]).find((p) => p?.id === def.id)
            return found ? { ...def, plans: { ...def.plans, ...found.plans } } : def
          })
        }
      } catch {
        // Fallback to default permissions silently
      }
    }
  }
  return JSON.parse(JSON.stringify(defaultPermissions))
}

function persistPermissions() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions.value))
  }
}

export function usePlanPermissions() {
  const togglePermission = (featureId: string, plan: PlanTier) => {
    const target = permissions.value.find(p => p.id === featureId)
    if (target) {
      target.plans[plan] = !target.plans[plan]
      persistPermissions()
    }
  }

  const setPermission = (featureId: string, plan: PlanTier, value: boolean) => {
    const target = permissions.value.find(p => p.id === featureId)
    if (target) {
      target.plans[plan] = value
      persistPermissions()
    }
  }

  const resetToDefault = () => {
    permissions.value = JSON.parse(JSON.stringify(defaultPermissions))
    persistPermissions()
  }

  const getActiveFeaturesForPlan = (plan: PlanTier, isAr: boolean) => {
    return permissions.value
      .filter(p => p.plans[plan])
      .map(p => ({
        id: p.id,
        name: isAr ? p.nameAr : p.name,
        description: isAr ? p.descriptionAr : p.description,
        category: isAr ? p.categoryNameAr : p.categoryName
      }))
  }

  const groupedPermissions = computed(() => {
    const groups: {
      category: FeatureCategory
      name: string
      nameAr: string
      features: FeaturePermission[]
    }[] = [
      {
        category: 'news',
        name: 'Market News',
        nameAr: 'أخبار السوق',
        features: permissions.value.filter(p => p.category === 'news')
      },
      {
        category: 'articles',
        name: 'Articles & Guides',
        nameAr: 'المقالات والأدلة',
        features: permissions.value.filter(p => p.category === 'articles')
      },
      {
        category: 'videos',
        name: 'Video Courses',
        nameAr: 'دورات الفيديو',
        features: permissions.value.filter(p => p.category === 'videos')
      }
    ]
    return groups
  })

  const planFeatureCounts = computed(() => ({
    FREE: permissions.value.filter(p => p.plans.FREE).length,
    BASIC: permissions.value.filter(p => p.plans.BASIC).length,
    PRO: permissions.value.filter(p => p.plans.PRO).length,
  }))

  return {
    permissions,
    groupedPermissions,
    planFeatureCounts,
    togglePermission,
    setPermission,
    resetToDefault,
    getActiveFeaturesForPlan,
    persistPermissions,
  }
}
