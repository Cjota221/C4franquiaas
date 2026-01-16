/**
 * 🎬 VIDEO UPLOAD OPTIMIZER
 * 
 * Validações de upload para garantir performance:
 * - Tamanho máximo: 50MB (recomendado: 10MB)
 * - Duração máxima: 60 segundos
 * - Resolução máxima: 1080p
 * - Formatos aceitos: MP4, WebM
 * - Bitrate máximo sugerido: 2.5 Mbps
 * 
 * DICA: Para compressão server-side, use FFmpeg via Edge Function
 */

export interface VideoValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    duration?: number;
    width?: number;
    height?: number;
    size: number;
    sizeFormatted: string;
    type: string;
    estimatedBitrate?: number;
  };
}

// ============================================
// CONFIGURAÇÕES DE LIMITE
// ============================================
export const VIDEO_LIMITS = {
  // Tamanho
  MAX_SIZE_MB: 50,
  RECOMMENDED_SIZE_MB: 10,
  
  // Duração
  MAX_DURATION_SECONDS: 60,
  RECOMMENDED_DURATION_SECONDS: 30,
  
  // Resolução
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1920,
  RECOMMENDED_WIDTH: 720,
  RECOMMENDED_HEIGHT: 1280,
  
  // Bitrate (bits por segundo)
  MAX_BITRATE_BPS: 5_000_000, // 5 Mbps
  RECOMMENDED_BITRATE_BPS: 2_500_000, // 2.5 Mbps
  
  // Formatos aceitos
  ACCEPTED_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  ACCEPTED_EXTENSIONS: ['.mp4', '.webm', '.mov'],
};

// ============================================
// FORMATAR TAMANHO
// ============================================
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================
// OBTER METADATA DO VÍDEO
// ============================================
export function getVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Não foi possível ler o vídeo'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

// ============================================
// VALIDAR VÍDEO COMPLETO
// ============================================
export async function validateVideo(file: File): Promise<VideoValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const sizeInMB = file.size / (1024 * 1024);
  let metadata: VideoValidationResult['metadata'] = {
    size: file.size,
    sizeFormatted: formatFileSize(file.size),
    type: file.type,
  };

  // ============================================
  // 1. VALIDAR TIPO
  // ============================================
  if (!VIDEO_LIMITS.ACCEPTED_TYPES.includes(file.type)) {
    errors.push(`Formato não aceito: ${file.type}. Use MP4 ou WebM.`);
  }

  // ============================================
  // 2. VALIDAR TAMANHO
  // ============================================
  if (sizeInMB > VIDEO_LIMITS.MAX_SIZE_MB) {
    errors.push(`Arquivo muito grande: ${formatFileSize(file.size)}. Máximo: ${VIDEO_LIMITS.MAX_SIZE_MB}MB.`);
  } else if (sizeInMB > VIDEO_LIMITS.RECOMMENDED_SIZE_MB) {
    warnings.push(`Arquivo grande: ${formatFileSize(file.size)}. Recomendado: até ${VIDEO_LIMITS.RECOMMENDED_SIZE_MB}MB para melhor performance.`);
  }

  // ============================================
  // 3. VALIDAR METADATA (duração, resolução)
  // ============================================
  try {
    const videoMeta = await getVideoMetadata(file);
    metadata = {
      ...metadata,
      duration: videoMeta.duration,
      width: videoMeta.width,
      height: videoMeta.height,
      estimatedBitrate: Math.round((file.size * 8) / videoMeta.duration), // bits por segundo
    };

    // Validar duração
    if (videoMeta.duration > VIDEO_LIMITS.MAX_DURATION_SECONDS) {
      errors.push(`Vídeo muito longo: ${Math.round(videoMeta.duration)}s. Máximo: ${VIDEO_LIMITS.MAX_DURATION_SECONDS}s.`);
    } else if (videoMeta.duration > VIDEO_LIMITS.RECOMMENDED_DURATION_SECONDS) {
      warnings.push(`Vídeo longo: ${Math.round(videoMeta.duration)}s. Recomendado: até ${VIDEO_LIMITS.RECOMMENDED_DURATION_SECONDS}s.`);
    }

    // Validar resolução
    if (videoMeta.width > VIDEO_LIMITS.MAX_WIDTH || videoMeta.height > VIDEO_LIMITS.MAX_HEIGHT) {
      errors.push(`Resolução muito alta: ${videoMeta.width}x${videoMeta.height}. Máximo: ${VIDEO_LIMITS.MAX_WIDTH}x${VIDEO_LIMITS.MAX_HEIGHT}.`);
    }

    // Validar bitrate estimado
    if (metadata.estimatedBitrate && metadata.estimatedBitrate > VIDEO_LIMITS.MAX_BITRATE_BPS) {
      warnings.push(`Bitrate alto: ${Math.round(metadata.estimatedBitrate / 1_000_000 * 10) / 10} Mbps. Considere comprimir para melhor streaming.`);
    }

  } catch (err) {
    warnings.push('Não foi possível ler metadados do vídeo.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata,
  };
}

// ============================================
// HOOK PARA VALIDAÇÃO EM TEMPO REAL
// ============================================
export function useVideoValidation() {
  const validate = async (file: File): Promise<VideoValidationResult> => {
    return validateVideo(file);
  };

  return { validate, limits: VIDEO_LIMITS };
}

// ============================================
// GERAR THUMBNAIL DO VÍDEO
// ============================================
export function generateVideoThumbnail(
  file: File, 
  timeSeconds: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      video.currentTime = Math.min(timeSeconds, video.duration);
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(video.src);
      resolve(thumbnail);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Erro ao gerar thumbnail'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

// ============================================
// COMPRIMIR VÍDEO NO CLIENTE (básico)
// Para compressão real, use FFmpeg no servidor
// ============================================
export async function compressVideoClient(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1
  } = {}
): Promise<Blob | null> {
  // Nota: Compressão real de vídeo no browser é limitada
  // Para produção, use FFmpeg via API/Edge Function
  
  console.warn('compressVideoClient: Para compressão real, use FFmpeg no servidor.');
  
  // Retorna o arquivo original se não houver MediaRecorder
  if (!('MediaRecorder' in window)) {
    return file;
  }
  
  // Implementação básica com MediaRecorder
  // Limitada em qualidade e suporte cross-browser
  return null;
}
