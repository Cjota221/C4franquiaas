import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [API] Erro de autenticação:', authError)
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    console.log('✅ [API] Usuário autenticado:', user.id)

    // Obter o arquivo do FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      )
    }

    if (!type || !['header', 'footer'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo inválido. Use "header" ou "footer"' },
        { status: 400 }
      )
    }

    console.log('📄 [API] Upload de arquivo:', {
      name: file.name,
      size: file.size,
      type: file.type,
      bannerType: type
    })

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Gerar nome único do arquivo
    const timestamp = Date.now()
    const fileName = `custom-${type}-${timestamp}.png`
    const filePath = `${user.id}/banners/${fileName}`

    console.log('📤 [API] Enviando para Storage:', {
      bucket: 'banner-uploads',
      path: filePath
    })

    // Upload usando service role (bypassa RLS)
    const { data, error: uploadError } = await supabase.storage
      .from('banner-uploads')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('❌ [API] Erro no upload:', uploadError)
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Upload bem-sucedido:', data)

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('banner-uploads')
      .getPublicUrl(filePath)

    console.log('🔗 [API] URL pública:', publicUrl)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath
    })

  } catch (error) {
    console.error('❌ [API] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro ao processar upload' },
      { status: 500 }
    )
  }
}
