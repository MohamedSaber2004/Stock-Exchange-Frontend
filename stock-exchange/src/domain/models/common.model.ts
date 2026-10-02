export interface ApiResponse<T = unknown> {
  success: boolean
  isSuccess: boolean
  message: string | null
  statusCode: number
  data: T | null
  errors: Record<string, string[]>
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}

export interface AppError {
  code: string
  message: string
  statusCode?: number
  status?: number
  errors?: Record<string, string[]>
  allErrors?: string[]
  fieldErrors?: Record<string, string>
  details?: unknown
}

/**
 * دالة استخراج الأخطاء من استجابة الـ Backend الموحدة
 * تقوم باستخراج الأخطاء الدقيقة من قائمة errors وتفضيلها دائماً على الرسائل العامة
 * وتوفر الحقول بـ camelCase و PascalCase لسهولة الربط مع الـ Inputs
 */
export function extractApiErrors(errorResponse: unknown): {
  generalMessage: string
  fieldErrors: Record<string, string>
  allErrors: string[]
  statusCode: number
} {
  const defaultMessage = 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.'
  let data: Partial<ApiResponse> | undefined
  let statusCode = 500
  let fallbackMessage = ''

  if (typeof errorResponse === 'object' && errorResponse !== null) {
    const errObj = errorResponse as Record<string, unknown>

    if (errObj.response && typeof errObj.response === 'object') {
      const resp = errObj.response as Record<string, unknown>
      if (resp.data && typeof resp.data === 'object') {
        data = resp.data as ApiResponse
        statusCode = (resp.status as number) || data.statusCode || 500
      }
    } else if (errObj.details && typeof errObj.details === 'object') {
      data = errObj.details as ApiResponse
      statusCode = (errObj.status as number) || (errObj.statusCode as number) || (data as unknown as Record<string, unknown>)?.statusCode as number || 500
    } else if ('statusCode' in errObj && ('errors' in errObj || 'message' in errObj)) {
      data = errObj as unknown as ApiResponse
      statusCode = Number(data.statusCode) || 500
    } else if (errObj.errors && typeof errObj.errors === 'object') {
      data = errObj as unknown as ApiResponse
      statusCode = Number(errObj.statusCode || errObj.status) || 500
    }

    if (errObj.message && typeof errObj.message === 'string') {
      fallbackMessage = errObj.message
    }
  }

  const fieldErrors: Record<string, string> = {}
  const allErrors: string[] = []
  let generalSpecificError: string | null = null

  // استخراج الأخطاء من كائن errors القادم من الـ Backend
  const errorsSource = data?.errors || (errorResponse as Record<string, unknown>)?.errors
  if (errorsSource) {
    if (typeof errorsSource === 'object' && !Array.isArray(errorsSource)) {
      for (const [key, val] of Object.entries(errorsSource)) {
        const msgs = Array.isArray(val) ? val : [String(val)]
        for (const msg of msgs) {
          if (!msg || typeof msg !== 'string') continue
          allErrors.push(msg)

          if (key.toLowerCase() === 'general') {
            if (!generalSpecificError) generalSpecificError = msg
          } else {
            const camelKey = key.charAt(0).toLowerCase() + key.slice(1)
            if (!fieldErrors[camelKey]) {
              fieldErrors[camelKey] = msg
            }
            if (!fieldErrors[key]) {
              fieldErrors[key] = msg
            }
          }
        }
      }
    } else if (Array.isArray(errorsSource)) {
      for (const item of errorsSource) {
        if (typeof item === 'string' && item) {
          allErrors.push(item)
        } else if (typeof item === 'object' && item !== null) {
          const itemObj = item as Record<string, unknown>
          const msg = String(itemObj.message || itemObj.description || itemObj.error || '')
          if (msg) allErrors.push(msg)
          const field = String(itemObj.field || itemObj.propertyName || '')
          if (field && msg) {
            const camelKey = field.charAt(0).toLowerCase() + field.slice(1)
            fieldErrors[camelKey] = msg
            fieldErrors[field] = msg
          }
        }
      }
    }
  }

  // ترتيب أولوية الرسالة العامة:
  // 1. الخطأ المحدد العام من errors["General"]
  // 2. أول خطأ تفصيلي من قائمة الأخطاء (allErrors)
  // 3. رسالة الـ Backend المباشرة (data.message)
  // 4. رسالة الكائن الاحتياطية (fallbackMessage)
  // 5. الرسالة العامة الافتراضية
  let generalMessage = defaultMessage
  if (generalSpecificError) {
    generalMessage = generalSpecificError
  } else if (allErrors.length > 0 && allErrors[0]) {
    generalMessage = allErrors[0]
  } else if (data?.message && typeof data.message === 'string' && data.message.trim()) {
    generalMessage = data.message.trim()
  } else if (fallbackMessage && fallbackMessage.trim()) {
    generalMessage = fallbackMessage.trim()
  }

  return {
    generalMessage,
    fieldErrors,
    allErrors,
    statusCode: data?.statusCode || statusCode,
  }
}

