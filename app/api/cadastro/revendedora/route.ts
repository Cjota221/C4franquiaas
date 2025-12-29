import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

// Função para gerar slug a partir do nome da loja
function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      nome, 
      email, 
      telefone, 
      cpf, 
      dataNascimento,
      instagram,
      facebook,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade, 
      estado, 
      nomeLoja,
      sobreMim,
      comoConheceu,
      temExperiencia,
      canalVendas,
      expectativaVendas,
      senha 
    } = body;

    // Validações básicas
    if (!nome || !email || !telefone || !cpf || !nomeLoja || !cidade || !estado || !senha) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 });
    }

    if (!cep || !rua || !numero || !bairro) {
      return NextResponse.json({ error: 'Endereço incompleto' }, { status: 400 });
    }

    if (senha.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('[api/cadastro/revendedora] Variáveis de ambiente ausentes');
      return NextResponse.json({ error: 'Configuração do servidor ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verificar se email já existe na tabela resellers
    const { data: existingEmail } = await supabase
      .from('resellers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 });
    }

    // Gerar slug único para a loja
    const slug = gerarSlug(nomeLoja);
    let slugFinal = slug;
    let contador = 1;

    // Verificar se slug já existe e criar um único
    while (true) {
      const { data: existingSlug } = await supabase
        .from('resellers')
        .select('id')
        .eq('slug', slugFinal)
        .single();

      if (!existingSlug) break;
      
      slugFinal = `${slug}-${contador}`;
      contador++;
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // Auto-confirma o email
      user_metadata: {
        nome,
        tipo: 'revendedora'
      }
    });

    if (authError) {
      console.error('[api/cadastro/revendedora] Erro ao criar usuário Auth:', authError);
      
      // Verificar se é erro de email duplicado no Auth
      if (authError.message.includes('already been registered')) {
        return NextResponse.json({ 
          error: 'Este email já possui uma conta. Tente fazer login.' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Erro ao criar conta: ' + authError.message 
      }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
    }

    // Inserir revendedora com status 'pendente'
    const { data, error } = await supabase
      .from('resellers')
      .insert({
        name: nome,
        email,
        phone: telefone,
        cpf,
        birth_date: dataNascimento || null,
        instagram: instagram || null,
        facebook: facebook || null,
        cep: cep || null,
        street: rua || null,
        number: numero || null,
        complement: complemento || null,
        neighborhood: bairro || null,
        city: cidade,
        state: estado,
        store_name: nomeLoja,
        slug: slugFinal,
        about_me: sobreMim || null,
        how_did_you_find_us: comoConheceu || null,
        has_experience_selling: temExperiencia || false,
        main_sales_channel: canalVendas || null,
        expected_monthly_sales: expectativaVendas || null,
        status: 'pendente',
        is_active: false,
        user_id: authData.user.id,
        total_products: 0,
        catalog_views: 0
      })
      .select()
      .single();

    if (error) {
      console.error('[api/cadastro/revendedora] Erro ao inserir:', error);
      
      // Se falhar ao inserir na tabela, remove o usuário criado no Auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json({ error: 'Erro ao salvar dados: ' + error.message }, { status: 500 });
    }

    console.log('[api/cadastro/revendedora] ✓ Revendedora cadastrada:', data.id, '-', data.name);
    console.log('[api/cadastro/revendedora] ✓ Slug da loja:', slugFinal);
    console.log('[api/cadastro/revendedora] ✓ Status: pendente (aguardando aprovação)');

    return NextResponse.json({ 
      success: true, 
      message: 'Cadastro realizado com sucesso! Aguarde a aprovação.',
      data: {
        id: data.id,
        nome: data.name,
        loja: data.store_name,
        slug: data.slug
      }
    }, { status: 201 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    console.error('[api/cadastro/revendedora] Erro geral:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
