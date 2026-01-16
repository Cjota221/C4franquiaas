'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, AlertCircle, CheckCircle, Film } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================
const CONFIG = {
  MAX_FILE_SIZE: 30 * 1024 * 1024, // 30MB
  MAX_DURATION: 60, // 60 segundos
  ALLOWED_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  ALLOWED_EXTENSIONS: ['.mp4', '.webm', '.mov'],
};

// ============================================================================
// TIPOS
// ============================================================================
export interface VideoUploaderProps {
  currentVideoUrl?: string | null;
  onVideoUploaded: (url: string, thumbnail?: string, duration?: number) => void;
  onVideoRemoved?: () => void;
  folder?: string; // Pasta no bucket (ex: 'produtos', 'reels')
  className?: string;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  isVertical: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extrai metadados do vídeo (duração, dimensões)
 */
function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        isVertical: video.videoHeight > video.videoWidth,
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Não foi possível ler o vídeo'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Gera thumbnail do vídeo (captura frame)
 */
function generateThumbnail(file: File, timeInSeconds: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      video.currentTime = Math.min(timeInSeconds, video.duration / 2);
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);
      
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
      URL.revokeObjectURL(video.src);
      resolve(thumbnailUrl);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Erro ao gerar thumbnail'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Formata tamanho em bytes para string legível
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formata duração em segundos para MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function VideoUploader({
  currentVideoUrl,
  onVideoUploaded,
  onVideoRemoved,
  folder = 'produtos',
  className = '',
}: VideoUploaderProps) {
  // Estados
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentVideoUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [isSaved, setIsSaved] = useState(!!currentVideoUrl);
  
  // Atualizar quando currentVideoUrl mudar (vídeo foi salvo no banco)
  useEffect(() => {
    if (currentVideoUrl) {
      setPreviewUrl(currentVideoUrl);
      setIsSaved(true);
    } else {
      setIsSaved(false);
    }
  }, [currentVideoUrl]);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // ============================================================================
  // VALIDAÇÃO CLIENT-SIDE
  // ============================================================================
  const validateFile = useCallback(async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // 1. Validar tipo
    if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: `Formato não suportado. Use: ${CONFIG.ALLOWED_EXTENSIONS.join(', ')}` 
      };
    }
    
    // 2. Validar tamanho
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `Arquivo muito grande. Máximo: ${formatFileSize(CONFIG.MAX_FILE_SIZE)}` 
      };
    }
    
    // 3. Validar duração
    try {
      const metadata = await getVideoMetadata(file);
      setVideoMetadata(metadata);
      
      if (metadata.duration > CONFIG.MAX_DURATION) {
        return { 
          valid: false, 
          error: `Vídeo muito longo (${formatDuration(metadata.duration)}). Máximo: ${CONFIG.MAX_DURATION}s` 
        };
      }
      
      // Aviso sobre vídeo horizontal
      if (!metadata.isVertical) {
        toast.info('💡 Dica: Vídeos verticais ficam melhores no feed!');
      }
      
    } catch {
      // Se não conseguir ler metadata, permite o upload
      console.warn('Não foi possível ler metadados do vídeo');
    }
    
    return { valid: true };
  }, []);
  
  // ============================================================================
  // UPLOAD
  // ============================================================================
  const uploadVideo = useCallback(async (file: File) => {
    setError(null);
    setUploadProgress(0);
    setIsSaved(false); // Reset - novo upload ainda não foi salvo no banco
    
    // Validar
    const validation = await validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Arquivo inválido');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const supabase = createClient();
      
      // Gerar nome único
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'mp4';
      const fileName = `${folder}/${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
      
      // Criar preview local enquanto faz upload
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      
      // Simular progresso inicial (Supabase não dá progresso real no JS client)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);
      
      // Upload para Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      clearInterval(progressInterval);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Pegar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(data.path);
      
      setUploadProgress(95);
      
      // Gerar thumbnail
      let thumbnailUrl: string | undefined;
      try {
        const thumbnailData = await generateThumbnail(file);
        
        // Upload da thumbnail
        const thumbnailBlob = await fetch(thumbnailData).then(r => r.blob());
        const thumbnailFileName = `${folder}/thumb-${timestamp}.jpg`;
        
        const { data: thumbData } = await supabase.storage
          .from('videos')
          .upload(thumbnailFileName, thumbnailBlob, {
            cacheControl: '3600',
            contentType: 'image/jpeg',
          });
        
        if (thumbData) {
          const { data: { publicUrl: thumbUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(thumbData.path);
          thumbnailUrl = thumbUrl;
        }
      } catch (e) {
        console.warn('Não foi possível gerar thumbnail:', e);
      }
      
      setUploadProgress(100);
      setPreviewUrl(publicUrl);
      
      // Callback com URL, thumbnail e duração
      onVideoUploaded(
        publicUrl, 
        thumbnailUrl, 
        videoMetadata?.duration ? Math.round(videoMetadata.duration) : undefined
      );
      
      toast.success('🎬 Vídeo enviado com sucesso!');
      
    } catch (err) {
      console.error('Erro no upload:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar vídeo');
      setPreviewUrl(currentVideoUrl || null);
      toast.error('Erro ao enviar vídeo');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [folder, validateFile, onVideoUploaded, currentVideoUrl, videoMetadata]);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadVideo(file);
    // Reset input
    if (inputRef.current) inputRef.current.value = '';
  }, [uploadVideo]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) uploadVideo(file);
  }, [uploadVideo]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleRemoveVideo = useCallback(async () => {
    if (previewUrl && previewUrl !== currentVideoUrl) {
      // Se for uma URL do Supabase, tentar deletar
      try {
        const supabase = createClient();
        const path = previewUrl.split('/videos/')[1];
        if (path) {
          await supabase.storage.from('videos').remove([path]);
        }
      } catch (e) {
        console.warn('Erro ao deletar vídeo:', e);
      }
    }
    
    setPreviewUrl(null);
    setVideoMetadata(null);
    onVideoRemoved?.();
  }, [previewUrl, currentVideoUrl, onVideoRemoved]);
  
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);
  
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  // Se tem vídeo, mostrar preview
  if (previewUrl) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative aspect-[9/16] max-w-[200px] rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            src={previewUrl}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
            poster={videoMetadata ? undefined : undefined}
            onEnded={() => setIsPlaying(false)}
          />
          
          {/* Overlay de controles */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 hover:opacity-100 transition-opacity">
            {/* Botão Play/Pause central */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </div>
            </button>
            
            {/* Controles inferiores */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-black/50 text-white"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              
              {videoMetadata && (
                <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                  {formatDuration(videoMetadata.duration)}
                </span>
              )}
            </div>
            
            {/* Botão remover */}
            <button
              onClick={handleRemoveVideo}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Badge de status */}
          <div className="absolute top-2 left-2">
            {isSaved ? (
              <span className="flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-1 rounded-full shadow-lg">
                <CheckCircle className="w-3 h-3" />
                Salvo
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs bg-blue-500 text-white px-2 py-1 rounded-full shadow-lg animate-pulse">
                <Film className="w-3 h-3" />
                Novo
              </span>
            )}
          </div>
        </div>
        
        {/* Info do vídeo */}
        {videoMetadata && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            {videoMetadata.width}x{videoMetadata.height} • {formatDuration(videoMetadata.duration)}
            {videoMetadata.isVertical && ' • Vertical ✓'}
          </p>
        )}
      </div>
    );
  }
  
  // Área de upload
  return (
    <div className={className}>
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative aspect-[9/16] max-w-[200px] rounded-xl border-2 border-dashed 
          transition-all cursor-pointer
          ${isDragging 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          {isUploading ? (
            <>
              {/* Barra de progresso circular */}
              <div className="relative w-16 h-16 mb-3">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${uploadProgress * 1.76} 176`}
                    className="text-purple-500 transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-purple-600">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Enviando vídeo...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <Film className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Vídeo do Produto
              </p>
              <p className="text-xs text-gray-500">
                Arraste ou clique para enviar
              </p>
              <p className="text-xs text-gray-400 mt-2">
                MP4/WebM • Máx {formatFileSize(CONFIG.MAX_FILE_SIZE)} • {CONFIG.MAX_DURATION}s
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
