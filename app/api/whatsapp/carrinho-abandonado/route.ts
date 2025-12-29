import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { sendWhatsAppMessage, WhatsAppTemplates, isEvolutionConfigured } from '@/lib/whatsapp/evolution';

/**
 * API para registrar carrinho abandonado
 * 
 * Quando o cliente adiciona itens ao carrinho mas não finaliza,
 * registramos para enviar lembrete depois.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      lojaId, 
      telefone, 
      nome, 
      email,
      itens, // Array de { nome, quantidade, preco, imagem }
      total,
      dominioLoja 
    } = body;

    if (!lojaId || !telefone || !itens || itens.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verificar se já existe um carrinho abandonado recente para este telefone
    const { data: existingCart } = await supabase
      .from('abandoned_carts')
      .select('id, created_at')
      .eq('phone', telefone)
      .eq('loja_id', lojaId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Se já existe um carrinho nas últimas 24h, atualiza ao invés de criar novo
    if (existingCart) {
      const { error } = await supabase
        .from('abandoned_carts')
        .update({
          items: itens,
          total,
          customer_name: nome || null,
          customer_email: email || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCart.id);

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        message: 'Carrinho atualizado',
        cartId: existingCart.id 
      });
    }

    // Criar novo registro de carrinho abandonado
    const { data, error } = await supabase
      .from('abandoned_carts')
      .insert({
        loja_id: lojaId,
        phone: telefone,
        customer_name: nome || null,
        customer_email: email || null,
        items: itens,
        total,
        dominio: dominioLoja,
        status: 'pending', // pending, reminded, recovered, expired
        reminder_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    console.log('[Carrinho Abandonado] Registrado:', data.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Carrinho registrado para lembrete',
      cartId: data.id 
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    console.error('[Carrinho Abandonado] Erro:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET - Processar carrinhos abandonados e enviar lembretes
 * 
 * Deve ser chamado por um cron job (ex: a cada 30 minutos)
 * Vercel Cron, Netlify Functions Scheduled, ou serviço externo
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar secret para proteção do endpoint
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!isEvolutionConfigured()) {
      return NextResponse.json({ 
        error: 'Evolution API não configurada',
        message: 'Configure EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE'
      }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Configurações de tempo (em minutos)
    const FIRST_REMINDER_AFTER = 30; // Primeiro lembrete após 30 min
    const SECOND_REMINDER_AFTER = 120; // Segundo lembrete após 2 horas
    const EXPIRE_AFTER = 1440; // Expira após 24 horas

    const now = new Date();
    const firstReminderTime = new Date(now.getTime() - FIRST_REMINDER_AFTER * 60000);
    const secondReminderTime = new Date(now.getTime() - SECOND_REMINDER_AFTER * 60000);
    const expireTime = new Date(now.getTime() - EXPIRE_AFTER * 60000);

    // Buscar carrinhos para primeiro lembrete (30+ min, 0 lembretes)
    const { data: firstReminders } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('status', 'pending')
      .eq('reminder_count', 0)
      .lt('created_at', firstReminderTime.toISOString())
      .gt('created_at', expireTime.toISOString())
      .limit(50);

    // Buscar carrinhos para segundo lembrete (2h+, 1 lembrete)
    const { data: secondReminders } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('status', 'pending')
      .eq('reminder_count', 1)
      .lt('created_at', secondReminderTime.toISOString())
      .gt('created_at', expireTime.toISOString())
      .limit(50);

    // Expirar carrinhos antigos
    await supabase
      .from('abandoned_carts')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('created_at', expireTime.toISOString());

    const results = {
      firstReminders: 0,
      secondReminders: 0,
      errors: 0
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://c4franquiaas.netlify.app';

    // Processar primeiros lembretes
    for (const cart of firstReminders || []) {
      try {
        const itensTexto = cart.items
          .map((item: { nome: string; quantidade: number; preco: number }) => 
            `• ${item.nome} (${item.quantidade}x) - R$ ${item.preco.toFixed(2)}`
          )
          .join('\n');

        const linkCarrinho = `${baseUrl}/loja/${cart.dominio}/carrinho`;

        const message = WhatsAppTemplates.abandonedCart(
          cart.customer_name || 'Cliente',
          itensTexto,
          `R$ ${cart.total.toFixed(2)}`,
          linkCarrinho
        );

        const result = await sendWhatsAppMessage({ phone: cart.phone, message });

        if (result.success) {
          await supabase
            .from('abandoned_carts')
            .update({ 
              reminder_count: 1,
              last_reminder_at: now.toISOString()
            })
            .eq('id', cart.id);
          
          results.firstReminders++;
        } else {
          results.errors++;
        }

        // Aguardar entre mensagens para não ser bloqueado
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err) {
        console.error('[Carrinho Abandonado] Erro ao processar:', err);
        results.errors++;
      }
    }

    // Processar segundos lembretes
    for (const cart of secondReminders || []) {
      try {
        const itensTexto = cart.items
          .map((item: { nome: string; quantidade: number; preco: number }) => 
            `• ${item.nome} (${item.quantidade}x)`
          )
          .join('\n');

        const linkCarrinho = `${baseUrl}/loja/${cart.dominio}/carrinho`;

        // Mensagem mais urgente no segundo lembrete
        const message = `
⏰ *Última chance!*

Oi${cart.customer_name ? `, ${cart.customer_name}` : ''}!

Seus produtos ainda estão esperando:
${itensTexto}

💰 Total: R$ ${cart.total.toFixed(2)}

Os itens podem esgotar! Garanta o seu:
👉 ${linkCarrinho}

Precisa de ajuda? Responda aqui! 💬
        `.trim();

        const result = await sendWhatsAppMessage({ phone: cart.phone, message });

        if (result.success) {
          await supabase
            .from('abandoned_carts')
            .update({ 
              reminder_count: 2,
              last_reminder_at: now.toISOString()
            })
            .eq('id', cart.id);
          
          results.secondReminders++;
        } else {
          results.errors++;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch {
        results.errors++;
      }
    }

    console.log('[Carrinho Abandonado] Processamento concluído:', results);

    return NextResponse.json({
      success: true,
      processed: results
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro';
    console.error('[Carrinho Abandonado] Erro:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
