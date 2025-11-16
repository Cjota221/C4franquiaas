import { createClient } from '@/lib/supabase/client';
import { getAuthUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Buscar usuário logado
    const { user, error: authError } = await getAuthUser(authHeader);
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Não autenticado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo inválido. Use PNG, JPG, WEBP ou SVG' }, { status: 400 });
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande (máximo 2MB)' }, { status: 400 });
    }

    // Gerar nome único
    const ext = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${ext}`;

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload para createClient() Storage
    const { error: uploadError } = await createClient().storage
      .from('logos')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      
      // Mensagem específica para bucket não encontrado
      if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Bucket "logos" não existe. Crie o bucket no createClient() Storage primeiro.',
          details: uploadError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: `Erro ao fazer upload: ${uploadError.message}`,
        details: uploadError 
      }, { status: 500 });
    }

    // Obter URL pública
    const { data: { publicUrl } } = createClient().storage
      .from('logos')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (err) {
    console.error('Erro inesperado no upload:', err);
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
