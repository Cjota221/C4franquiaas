import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// POST - Resetar senha de uma revendedora
export async function POST(request: NextRequest) {
  try {
    // Usar service_role para poder alterar senha de usuários
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const body = await request.json();
    const { resellerId } = body;

    if (!resellerId) {
      return NextResponse.json(
        { error: 'ID da revendedora é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔐 Resetando senha da revendedora:', resellerId);

    // 1. Buscar revendedora para pegar o user_id
    const { data: revendedora, error: resellerError } = await supabaseAdmin
      .from('resellers')
      .select('id, name, email, phone, user_id')
      .eq('id', resellerId)
      .single();

    if (resellerError || !revendedora) {
      console.error('❌ Revendedora não encontrada:', resellerError);
      return NextResponse.json(
        { error: 'Revendedora não encontrada' },
        { status: 404 }
      );
    }

    if (!revendedora.user_id) {
      return NextResponse.json(
        { error: 'Revendedora não possui conta de usuário vinculada' },
        { status: 400 }
      );
    }

    // 2. Gerar nova senha segura (8 caracteres alfanuméricos)
    const novaSenha = gerarSenhaSegura();

    // 3. Atualizar senha no Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      revendedora.user_id,
      { password: novaSenha }
    );

    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError);
      return NextResponse.json(
        { error: `Erro ao resetar senha: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Senha resetada com sucesso para:', revendedora.name);

    // 4. Retornar a nova senha (para o admin mostrar/enviar)
    return NextResponse.json({
      success: true,
      novaSenha,
      revendedora: {
        name: revendedora.name,
        email: revendedora.email,
        phone: revendedora.phone
      },
      mensagemWhatsApp: gerarMensagemWhatsApp(revendedora.name, revendedora.email, novaSenha)
    });

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    return NextResponse.json(
      { error: 'Erro interno ao resetar senha' },
      { status: 500 }
    );
  }
}

// Gera senha segura de 8 caracteres (letras e números, fácil de digitar)
function gerarSenhaSegura(): string {
  // Caracteres que não confundem (sem 0/O, 1/l/I)
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let senha = '';
  
  for (let i = 0; i < 8; i++) {
    const indice = Math.floor(Math.random() * caracteres.length);
    senha += caracteres[indice];
  }
  
  return senha;
}

// Gera mensagem pronta para WhatsApp
function gerarMensagemWhatsApp(nome: string, email: string, senha: string): string {
  return `Olá ${nome}! 👋

Sua senha foi resetada com sucesso! 🔐

*NOVOS DADOS DE ACESSO:*

📧 Email: ${email}
🔑 Senha: *${senha}*

🔗 *Acesse aqui:*
https://c4franquias.com/login/revendedora

⚠️ *PARA SUA SEGURANÇA:*
Após fazer login, altere sua senha clicando aqui:
👉 https://c4franquias.com/revendedora/configuracoes

No painel, vá em *"Redefinir Senha"* e crie uma senha de sua preferência.

Qualquer dúvida, estamos à disposição! 💬`;
}
