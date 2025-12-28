import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Buscar submissões de banners
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const resellerId = searchParams.get('reseller_id')
    const status = searchParams.get('status') // 'pending', 'approved', 'rejected', 'all'
    const forAdmin = searchParams.get('admin') === 'true'
    
    let query = supabase
      .from('banner_submissions')
      .select(`
        *,
        reseller:reseller_id (
          id,
          store_name,
          slug,
          logo_url
        )
      `)
      .order('created_at', { ascending: false })
    
    // Filtrar por revendedora (se não for admin)
    if (resellerId && !forAdmin) {
      query = query.eq('reseller_id', resellerId)
    }
    
    // Filtrar por status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    const { data: submissions, error } = await query
    
    if (error) {
      console.error('Erro ao buscar submissões:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar submissões de banners' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ submissions })
    
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova submissão de banner
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { reseller_id, banner_type, image_url } = body
    
    if (!reseller_id || !image_url) {
      return NextResponse.json(
        { error: 'reseller_id e image_url são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se já tem uma submissão pendente do mesmo tipo
    const { data: existingPending } = await supabase
      .from('banner_submissions')
      .select('id')
      .eq('reseller_id', reseller_id)
      .eq('banner_type', banner_type || 'desktop')
      .eq('status', 'pending')
      .single()
    
    if (existingPending) {
      return NextResponse.json(
        { error: 'Você já tem um banner pendente de aprovação. Aguarde a análise.' },
        { status: 400 }
      )
    }
    
    // Criar nova submissão
    const { data: submission, error } = await supabase
      .from('banner_submissions')
      .insert({
        reseller_id,
        banner_type: banner_type || 'desktop',
        image_url,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar submissão:', error)
      return NextResponse.json(
        { error: 'Erro ao enviar banner para aprovação' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      submission,
      message: 'Banner enviado para aprovação! Você será notificado quando for analisado.' 
    })
    
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Aprovar ou recusar banner (apenas admin)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { submission_id, action, feedback } = body
    
    if (!submission_id || !action) {
      return NextResponse.json(
        { error: 'submission_id e action são obrigatórios' },
        { status: 400 }
      )
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action deve ser "approve" ou "reject"' },
        { status: 400 }
      )
    }
    
    // Buscar o usuário atual (admin)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Buscar a submissão
    const { data: submission, error: fetchError } = await supabase
      .from('banner_submissions')
      .select('*')
      .eq('id', submission_id)
      .single()
    
    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submissão não encontrada' },
        { status: 404 }
      )
    }
    
    if (action === 'approve') {
      // Aprovar: atualizar status e setar banner no reseller
      const { error: updateError } = await supabase
        .from('banner_submissions')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', submission_id)
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Erro ao aprovar banner' },
          { status: 500 }
        )
      }
      
      // Atualizar o banner no reseller
      const updateData = submission.banner_type === 'mobile'
        ? { 
            banner_mobile_url: submission.image_url,
            approved_banner_mobile_id: submission_id 
          }
        : { 
            banner_url: submission.image_url,
            approved_banner_id: submission_id 
          }
      
      await supabase
        .from('resellers')
        .update(updateData)
        .eq('id', submission.reseller_id)
      
      return NextResponse.json({ 
        success: true,
        message: 'Banner aprovado com sucesso!' 
      })
      
    } else {
      // Recusar
      const defaultFeedback = 'O banner enviado não atende aos critérios da plataforma C4. ' +
        'Lembre-se: os banners devem conter apenas produtos do nosso catálogo. ' +
        'Em caso de dúvidas, entre em contato pelo WhatsApp.'
      
      const { error: updateError } = await supabase
        .from('banner_submissions')
        .update({
          status: 'rejected',
          admin_feedback: feedback || defaultFeedback,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', submission_id)
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Erro ao recusar banner' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'Banner recusado' 
      })
    }
    
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar submissão
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const submissionId = searchParams.get('id')
    
    if (!submissionId) {
      return NextResponse.json(
        { error: 'ID da submissão é obrigatório' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('banner_submissions')
      .delete()
      .eq('id', submissionId)
    
    if (error) {
      console.error('Erro ao deletar:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar submissão' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
