import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Criar cliente Supabase com service key (para operações admin)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}

// GET - Buscar submissões de banners da tabela banner_submissions
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    
    const resellerId = searchParams.get('reseller_id')
    const status = searchParams.get('status') // 'pending', 'approved', 'rejected', 'all'
    const forAdmin = searchParams.get('admin') === 'true'
    
    // BUSCAR DA TABELA banner_submissions (CORRETA)
    let query = supabase
      .from('banner_submissions')
      .select(`
        *,
        template:template_id (
          id,
          nome,
          desktop_url,
          mobile_url
        )
      `)
      .order('created_at', { ascending: false })
    
    // Filtrar por revendedora através do user_id
    if (resellerId && !forAdmin) {
      // Buscar user_id da revendedora
      const { data: resellerData } = await supabase
        .from('resellers')
        .select('user_id')
        .eq('id', resellerId)
        .single()
      
      if (resellerData?.user_id) {
        query = query.eq('user_id', resellerData.user_id)
      }
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
    
    // Se for admin, buscar dados das revendedoras para cada submission
    if (forAdmin && submissions && submissions.length > 0) {
      const userIds = [...new Set(submissions.map(s => s.user_id))]
      
      // Buscar revendedoras
      const { data: resellers } = await supabase
        .from('resellers')
        .select('user_id, id, store_name, slug, logo_url')
        .in('user_id', userIds)
      
      // Mapear revendedoras por user_id
      const resellersMap = new Map()
      if (resellers) {
        resellers.forEach(r => resellersMap.set(r.user_id, r))
      }
      
      // Adicionar dados da revendedora a cada submission
      const submissionsWithReseller = submissions.map(submission => ({
        ...submission,
        reseller: resellersMap.get(submission.user_id) || {
          id: '',
          store_name: 'Desconhecido',
          slug: '',
          logo_url: null
        }
      }))
      
      return NextResponse.json({ submissions: submissionsWithReseller })
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
    const supabase = getSupabaseAdmin()
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
      .from('banners')
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
      .from('banners')
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
    const supabase = getSupabaseAdmin()
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
    
    // Buscar reseller_id a partir do user_id
    const { data: resellerData } = await supabase
      .from('resellers')
      .select('id')
      .eq('user_id', submission.user_id)
      .single()
    
    if (!resellerData) {
      return NextResponse.json(
        { error: 'Revendedora não encontrada' },
        { status: 404 }
      )
    }
    
    if (action === 'approve') {
      let finalDesktopUrl = submission.desktop_final_url
      let finalMobileUrl = submission.mobile_final_url
      
      // Se o banner usa template, buscar as URLs do template como fallback
      if (submission.template_id) {
        const { data: template } = await supabase
          .from('banner_templates')
          .select('desktop_url, mobile_url')
          .eq('id', submission.template_id)
          .single()
        
        if (template) {
          // Usar URLs customizadas se existirem, senão usar as do template
          finalDesktopUrl = submission.desktop_final_url || template.desktop_url
          finalMobileUrl = submission.mobile_final_url || template.mobile_url
        }
      }
      // Se não tem template_id, é um banner 100% customizado (uploaded)
      // Usa apenas as URLs custom que já estão na submission
      
      // Aprovar: atualizar status e confirmar as URLs finais
      const { error: updateError } = await supabase
        .from('banner_submissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          desktop_final_url: finalDesktopUrl,
          mobile_final_url: finalMobileUrl
        })
        .eq('id', submission_id)
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Erro ao aprovar banner' },
          { status: 500 }
        )
      }
      
      // Atualizar o banner no reseller com as URLs finais (custom ou template)
      const updateData: { banner_url?: string; banner_mobile_url?: string } = {}
      if (finalDesktopUrl) {
        updateData.banner_url = finalDesktopUrl
      }
      if (finalMobileUrl) {
        updateData.banner_mobile_url = finalMobileUrl
      }
      
      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('resellers')
          .update(updateData)
          .eq('id', resellerData.id)
      }
      
      // 🆕 Criar notificação de aprovação
      await supabase.from('reseller_notifications').insert({
        reseller_id: resellerData.id,
        type: 'banner_approved',
        title: '✅ Banner aprovado!',
        message: `Seu banner personalizado foi aprovado e já está ativo em seu catálogo.`,
        metadata: {
          submission_id: submission_id,
          template_id: submission.template_id
        },
        action_url: '/revendedora/personalizacao',
        action_label: 'Ver loja'
      })
      
      return NextResponse.json({ 
        success: true,
        message: 'Banner aprovado com sucesso!' 
      })
      
    } else {
      // Recusar
      const defaultFeedback = 'O banner enviado não atende aos critérios da plataforma C4. ' +
        'Por favor, revise o conteúdo e tente novamente.'
      
      const { error: updateError } = await supabase
        .from('banner_submissions')
        .update({
          status: 'rejected',
          rejection_reason: feedback || defaultFeedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', submission_id)
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Erro ao recusar banner' },
          { status: 500 }
        )
      }
      
      // 🆕 Criar notificação de rejeição
      await supabase.from('reseller_notifications').insert({
        reseller_id: resellerData.id,
        type: 'banner_rejected',
        title: '❌ Banner recusado',
        message: `Seu banner personalizado foi recusado.`,
        metadata: {
          submission_id: submission_id,
          template_id: submission.template_id,
          feedback: feedback || defaultFeedback
        },
        action_url: '/revendedora/personalizacao',
        action_label: 'Enviar novo banner'
      })
      
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
    const supabase = getSupabaseAdmin()
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
