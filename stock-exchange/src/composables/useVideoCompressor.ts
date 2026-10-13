import { ref } from 'vue'
import {
  compressVideo,
  resetFFmpegInstance,
  type VideoQuality,
  type CompressionResult,
} from '@/utils/videoCompressor'

export function useVideoCompressor() {
  const isCompressing = ref(false)
  const compressionProgress = ref(0)
  const compressionEta = ref(0)
  const compressionStage = ref<'idle' | 'loading' | 'compressing' | 'completed' | 'error' | 'aborted'>('idle')
  const compressionMessage = ref('')
  const lastResult = ref<CompressionResult | null>(null)

  let abortController: AbortController | null = null

  const compress = async (
    file: File,
    options: { quality?: VideoQuality; maxHeight?: number } = {}
  ): Promise<CompressionResult> => {
    isCompressing.value = true
    compressionProgress.value = 0
    compressionEta.value = 0
    compressionStage.value = 'loading'
    compressionMessage.value = ''
    lastResult.value = null

    abortController = new AbortController()

    try {
      const result = await compressVideo(file, {
        quality: options.quality || 'standard',
        maxHeight: options.maxHeight,
        signal: abortController.signal,
        onProgress: ({ percentage, etaSeconds }) => {
          compressionProgress.value = percentage
          if (etaSeconds !== undefined) {
            compressionEta.value = etaSeconds
          }
        },
        onStatusChange: (status, msg) => {
          compressionStage.value = status
          if (msg) compressionMessage.value = msg
        },
      })

      lastResult.value = result
      compressionStage.value = 'completed'
      compressionProgress.value = 100
      compressionEta.value = 0
      return result
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        compressionStage.value = 'aborted'
        throw err
      }
      compressionStage.value = 'error'
      compressionMessage.value = (err as Error)?.message || 'Compression failed'
      throw err
    } finally {
      isCompressing.value = false
      abortController = null
    }
  }

  const cancel = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    resetFFmpegInstance()
    isCompressing.value = false
    compressionStage.value = 'aborted'
    compressionProgress.value = 0
    compressionEta.value = 0
  }

  return {
    isCompressing,
    compressionProgress,
    compressionEta,
    compressionStage,
    compressionMessage,
    lastResult,
    compress,
    cancel,
  }
}
