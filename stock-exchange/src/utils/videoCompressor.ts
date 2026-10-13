import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export type VideoQuality = 'standard' | 'high' | 'compact'

export interface CompressionOptions {
  quality?: VideoQuality
  maxHeight?: number
  onProgress?: (progress: { ratio: number; percentage: number; time?: number; etaSeconds?: number }) => void
  onStatusChange?: (status: 'loading' | 'compressing' | 'completed' | 'aborted' | 'error', message?: string) => void
  signal?: AbortSignal
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  savedBytes: number
  savedPercentage: number
}

let ffmpegSingleton: FFmpeg | null = null
let isLoadingEngine = false
let engineLoadPromise: Promise<FFmpeg> | null = null

export async function getFFmpeg(onStatus?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegSingleton && ffmpegSingleton.loaded) {
    return ffmpegSingleton
  }

  if (isLoadingEngine && engineLoadPromise) {
    return engineLoadPromise
  }

  isLoadingEngine = true
  engineLoadPromise = (async () => {
    const ffmpeg = new FFmpeg()

    onStatus?.('Loading compression engine...')

    // Strategy 1: Load from local public directory /ffmpeg/
    try {
      const classWorkerURL = await toBlobURL('/ffmpeg/ffmpeg-worker.js', 'text/javascript')
      const coreURL = await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript')
      const wasmURL = await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm')
      await ffmpeg.load({ classWorkerURL, coreURL, wasmURL })
      ffmpegSingleton = ffmpeg
      isLoadingEngine = false
      return ffmpeg
    } catch (localErr) {
      console.warn('Local FFmpeg core load failed, attempting CDN fallback...', localErr)
    }

    // Strategy 2: CDN fallback (unpkg)
    try {
      const cdnBase = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      const classWorkerURL = await toBlobURL('/ffmpeg/ffmpeg-worker.js', 'text/javascript')
      const coreURL = await toBlobURL(`${cdnBase}/ffmpeg-core.js`, 'text/javascript')
      const wasmURL = await toBlobURL(`${cdnBase}/ffmpeg-core.wasm`, 'application/wasm')
      await ffmpeg.load({ classWorkerURL, coreURL, wasmURL })
      ffmpegSingleton = ffmpeg
      isLoadingEngine = false
      return ffmpeg
    } catch (cdnErr) {
      isLoadingEngine = false
      engineLoadPromise = null
      throw new Error(`Failed to load video compression engine: ${(cdnErr as Error)?.message || 'Unknown error'}`)
    }
  })()

  return engineLoadPromise
}

/**
 * Resets the FFmpeg instance in case of cancellation or crash
 */
export function resetFFmpegInstance(): void {
  if (ffmpegSingleton) {
    try {
      ffmpegSingleton.terminate()
    } catch {
      // ignore
    }
    ffmpegSingleton = null
  }
  isLoadingEngine = false
  engineLoadPromise = null
}

/**
 * Compresses a video File using FFmpeg WebAssembly.
 *
 * Target profiles:
 * - 'standard' (Recommended): 720p HD, CRF 28, AAC 128k, faststart. Reduces size by 60-80% with crisp visual quality.
 * - 'high': 1080p Full HD, CRF 26, AAC 128k, faststart.
 * - 'compact': 480p, CRF 30, AAC 96k, ultrafast.
 */
export async function compressVideo(
  inputFile: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    quality = 'standard',
    onProgress,
    onStatusChange,
    signal,
  } = options

  if (signal?.aborted) {
    throw new DOMException('Compression cancelled by user', 'AbortError')
  }

  // Determine parameters based on quality preset:
  // Using 'ultrafast' is essential in WebAssembly (WASM) to eliminate multi-minute CPU bottlenecks.
  let targetHeight = 720
  let crf = '28'
  let preset = 'ultrafast'
  let audioBitrate = '128k'

  if (quality === 'high') {
    targetHeight = 1080
    crf = '26'
    preset = 'ultrafast'
    audioBitrate = '128k'
  } else if (quality === 'compact') {
    targetHeight = 480
    crf = '30'
    preset = 'ultrafast'
    audioBitrate = '96k'
  }

  if (options.maxHeight && options.maxHeight > 0) {
    targetHeight = options.maxHeight
  }

  onStatusChange?.('loading', 'Loading compression engine...')

  let ffmpeg: FFmpeg
  try {
    ffmpeg = await getFFmpeg((msg) => onStatusChange?.('loading', msg))
  } catch (loadErr) {
    onStatusChange?.('error', 'Failed to load video engine')
    throw loadErr
  }

  if (signal?.aborted) {
    throw new DOMException('Compression cancelled by user', 'AbortError')
  }

  const rawExt = inputFile.name.substring(inputFile.name.lastIndexOf('.') + 1).toLowerCase()
  const fileExt = rawExt || 'mp4'
  const inputFileName = `input_${Date.now()}.${fileExt}`
  const outputFileName = `output_${Date.now()}.mp4`

  let isTerminatedDueToAbort = false

  const abortHandler = () => {
    isTerminatedDueToAbort = true
    try {
      resetFFmpegInstance()
    } catch {
      // ignore
    }
  }

  signal?.addEventListener('abort', abortHandler, { once: true })

  // Track start time for accurate ETA calculation
  let encodeStartTime = 0
  let smoothedEta = 0

  // Attach progress listener
  const progressCallback = ({ progress, time }: { progress: number; time: number }) => {
    if (signal?.aborted) return
    const ratio = Math.max(0, Math.min(1, progress))
    const percentage = Math.min(99, Math.max(0, Math.round(ratio * 100)))

    if (!encodeStartTime) {
      encodeStartTime = Date.now()
    }

    let etaSeconds = 0
    const elapsedSecs = (Date.now() - encodeStartTime) / 1000

    if (ratio > 0.03 && elapsedSecs > 1.5) {
      const totalExpected = elapsedSecs / ratio
      const rawRemaining = Math.max(0, Math.round(totalExpected - elapsedSecs))
      smoothedEta = smoothedEta === 0 ? rawRemaining : Math.round(smoothedEta * 0.7 + rawRemaining * 0.3)
      etaSeconds = smoothedEta
    }

    onProgress?.({ ratio, percentage, time, etaSeconds })
  }

  ffmpeg.on('progress', progressCallback)

  try {
    onStatusChange?.('compressing', 'Reading video file...')
    const inputData = await fetchFile(inputFile)

    if (signal?.aborted || isTerminatedDueToAbort) {
      throw new DOMException('Compression cancelled by user', 'AbortError')
    }

    await ffmpeg.writeFile(inputFileName, inputData)

    onStatusChange?.('compressing', 'Compressing video...')
    encodeStartTime = Date.now()

    // Highly optimized FFmpeg execution command for WebAssembly:
    // - -threads 0: utilizes available Web Worker capacity
    // - scale=-2:min(ih\,targetHeight):flags=fast_bilinear: fast bilinear scaling prevents CPU choke
    // - -r 30: caps framerate to 30fps (halves processing time for 60fps mobile videos with zero perceptible loss)
    // - -preset ultrafast: essential for responsive client-side encoding
    // - -tune fastdecode: optimizes CABAC and loop filters for instant decoding
    // - -pix_fmt yuv420p: universal playback across iOS, Safari, Chrome & Android
    // - -movflags +faststart: allows immediate progressive streaming playback without downloading full video
    const execArgs = [
      '-i',
      inputFileName,
      '-threads',
      '0',
      '-vf',
      `scale=-2:min(ih\\,${targetHeight}):flags=fast_bilinear`,
      '-r',
      '30',
      '-c:v',
      'libx264',
      '-crf',
      crf,
      '-preset',
      preset,
      '-tune',
      'fastdecode',
      '-c:a',
      'aac',
      '-b:a',
      audioBitrate,
      '-ar',
      '44100',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      outputFileName,
    ]

    await ffmpeg.exec(execArgs)

    if (signal?.aborted || isTerminatedDueToAbort) {
      throw new DOMException('Compression cancelled by user', 'AbortError')
    }

    onProgress?.({ ratio: 1, percentage: 100 })
    onStatusChange?.('completed', 'Finalizing compressed video...')

    const outputData = await ffmpeg.readFile(outputFileName)
    let uint8Array: Uint8Array
    if (typeof outputData === 'string') {
      uint8Array = new TextEncoder().encode(outputData)
    } else {
      uint8Array = outputData
    }
    const outputBlob = new Blob([uint8Array as unknown as BlobPart], { type: 'video/mp4' })

    // Name output nicely with .mp4 extension
    const baseName = inputFile.name.replace(/\.[^/.]+$/, '')
    const finalFileName = `${baseName}.mp4`
    const compressedFile = new File([outputBlob], finalFileName, {
      type: 'video/mp4',
      lastModified: Date.now(),
    })

    const originalSize = inputFile.size
    const compressedSize = compressedFile.size
    const savedBytes = Math.max(0, originalSize - compressedSize)
    const savedPercentage = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0

    onStatusChange?.('completed', 'Done')

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      savedBytes,
      savedPercentage,
    }
  } catch (err: unknown) {
    if (signal?.aborted || isTerminatedDueToAbort) {
      onStatusChange?.('aborted', 'Compression cancelled')
      throw new DOMException('Compression cancelled by user', 'AbortError')
    }
    onStatusChange?.('error', (err as Error)?.message || 'Compression failed')
    throw err
  } finally {
    ffmpeg.off('progress', progressCallback)
    signal?.removeEventListener('abort', abortHandler)

    // Clean up temporary files from virtual filesystem
    try {
      await ffmpeg.deleteFile(inputFileName)
    } catch {
      // ignore
    }
    try {
      await ffmpeg.deleteFile(outputFileName)
    } catch {
      // ignore
    }
  }
}
