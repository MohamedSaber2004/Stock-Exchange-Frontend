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
  fieldErrors?: Record<string, string>
  details?: unknown
}

/**
 * دالة استخراج الأخطاء من استجابة الـ Backend الموحدة
 * تقوم بفصل الخطأ العام عن أخطاء الحقول مع تحويل المفاتيح إلى camelCase لسهولة الربط بنماذج الـ UI
 */
export function extractApiErrors(errorResponse: unknown): {
  generalMessage: string
  fieldErrors: Record<string, string>
  statusCode: number
} {
  const defaultMessage = 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.'
  let data: Partial<ApiResponse> | undefined
  let statusCode = 500

  if (typeof errorResponse === 'object' && errorResponse !== null) {
    const errObj = errorResponse as Record<string, unknown>

    // Check if error is wrapped in Axios response or HttpClient response or raw ApiResponse
    if (errObj.response && typeof errObj.response === 'object') {
      const resp = errObj.response as Record<string, unknown>
      if (resp.data && typeof resp.data === 'object') {
        data = resp.data as ApiResponse
        statusCode = (resp.status as number) || data.statusCode || 500
      }
    } else if ('statusCode' in errObj && ('errors' in errObj || 'message' in errObj)) {
      data = errObj as unknown as ApiResponse
      statusCode = data.statusCode || 500
    } else if (errObj.details && typeof errObj.details === 'object') {
      data = errObj.details as ApiResponse
      statusCode = (errObj.status as number) || (errObj.statusCode as number) || 500
    } else if (errObj.message) {
      return {
        generalMessage: String(errObj.message),
        fieldErrors: (errObj.fieldErrors as Record<string, string>) || {},
        statusCode: Number(errObj.statusCode || errObj.status || 500),
      }
    }
  }

  const fieldErrors: Record<string, string> = {}
  let generalMessage = data?.message || defaultMessage

  if (data?.errors && typeof data.errors === 'object') {
    for (const [key, messages] of Object.entries(data.errors)) {
      if (Array.isArray(messages) && messages.length > 0) {
        const firstMsg = messages[0]
        if (firstMsg) {
          if (key.toLowerCase() === 'general') {
            generalMessage = firstMsg
          } else {
            // تحويل أول حرف إلى camelCase ليتطابق مع الـ Form Inputs (مثل Email -> email)
            const camelCaseKey = key.charAt(0).toLowerCase() + key.slice(1)
            fieldErrors[camelCaseKey] = firstMsg
          }
        }
      }
    }
  }

  return {
    generalMessage,
    fieldErrors,
    statusCode: data?.statusCode || statusCode,
  }
}

