/**
 * 🎬 SUPABASE EDGE FUNCTION - VIDEO COMPRESSION
 * 
 * Esta função comprime vídeos usando FFmpeg antes de salvar no Storage.
 * 
 * DEPLOY:
 * 1. Instale Supabase CLI: npm install -g supabase
 * 2. supabase functions deploy compress-video
 * 
 * USO:
 * POST /functions/v1/compress-video
 * Body: FormData com campo "video"
 * 
 * NOTA: Esta é uma implementação de referência.
 * Para produção em larga escala, considere:
 * - Mux.com (streaming otimizado)
 * - Cloudflare Stream
 * - AWS MediaConvert
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configurações
const MAX_SIZE_MB = 50;
const OUTPUT_QUALITY = 'medium'; // low, medium, high
const TARGET_BITRATE = '1500k'; // 1.5 Mbps
const TARGET_RESOLUTION = '720:-2'; // 720p, altura automática

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Processar FormData
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;
    const productId = formData.get('productId') as string;

    if (!videoFile) {
      throw new Error('Nenhum vídeo enviado');
    }

    // Validar tamanho
    const sizeInMB = videoFile.size / (1024 * 1024);
    if (sizeInMB > MAX_SIZE_MB) {
      throw new Error(`Arquivo muito grande: ${sizeInMB.toFixed(2)}MB. Máximo: ${MAX_SIZE_MB}MB`);
    }

    // Gerar nome único
    const timestamp = Date.now();
    const extension = videoFile.name.split('.').pop() || 'mp4';
    const inputFileName = `temp_${timestamp}_input.${extension}`;
    const outputFileName = `video_${productId}_${timestamp}.mp4`;

    // Salvar arquivo temporário
    const videoBuffer = await videoFile.arrayBuffer();
    const tempInputPath = `/tmp/${inputFileName}`;
    const tempOutputPath = `/tmp/${outputFileName}`;
    
    await Deno.writeFile(tempInputPath, new Uint8Array(videoBuffer));

    // Comprimir com FFmpeg
    // NOTA: FFmpeg precisa estar disponível no ambiente Deno
    // Em produção, use um serviço dedicado ou container com FFmpeg
    const ffmpegCommand = new Deno.Command('ffmpeg', {
      args: [
        '-i', tempInputPath,
        '-vf', `scale=${TARGET_RESOLUTION}`,
        '-b:v', TARGET_BITRATE,
        '-c:v', 'libx264',
        '-preset', OUTPUT_QUALITY === 'low' ? 'ultrafast' : OUTPUT_QUALITY === 'high' ? 'slow' : 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart', // Importante para streaming
        '-y', // Sobrescrever
        tempOutputPath,
      ],
    });

    const ffmpegProcess = ffmpegCommand.spawn();
    const { code } = await ffmpegProcess.status;

    if (code !== 0) {
      // Se FFmpeg não disponível, fazer upload do original
      console.warn('FFmpeg não disponível, fazendo upload do original');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(`produtos/${outputFileName}`, videoBuffer, {
          contentType: 'video/mp4',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(`produtos/${outputFileName}`);

      return new Response(
        JSON.stringify({
          success: true,
          compressed: false,
          url: publicUrl,
          originalSize: sizeInMB.toFixed(2) + 'MB',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ler arquivo comprimido
    const compressedVideo = await Deno.readFile(tempOutputPath);
    const compressedSizeMB = compressedVideo.length / (1024 * 1024);

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(`produtos/${outputFileName}`, compressedVideo, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Limpar arquivos temporários
    await Deno.remove(tempInputPath).catch(() => {});
    await Deno.remove(tempOutputPath).catch(() => {});

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(`produtos/${outputFileName}`);

    // Atualizar produto com URL do vídeo
    if (productId) {
      await supabase
        .from('produtos')
        .update({ video_url: publicUrl })
        .eq('id', productId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        compressed: true,
        url: publicUrl,
        originalSize: sizeInMB.toFixed(2) + 'MB',
        compressedSize: compressedSizeMB.toFixed(2) + 'MB',
        reduction: ((1 - compressedSizeMB / sizeInMB) * 100).toFixed(1) + '%',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
