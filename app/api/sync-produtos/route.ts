import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Função para buscar os produtos da API externa (FácilZap)
// Em um cenário real, usaríamos 'fetch' com o token de autorização
async function fetchProdutosExternos() {
  console.log('Buscando dados da API Externa...');
  
  // ATENÇÃO: Estes são dados de EXEMPLO.
  // A estrutura (nome dos campos) deve ser ajustada para corresponder
  // exatamente ao que a API da FácilZap retorna.
  return [
    {
      id_unico_externo: 'FZ-001',
      nome_produto: 'Produto Sincronizado A',
      preco: 149.90,
      quantidade_estoque: 35,
      ean: '1234567890123', // Código de barras
      fotos: ['https://placehold.co/600x400/DB1472/white?text=Produto+A', 'https://placehold.co/600x400/DB1472/white?text=Produto+A2'],
      videos: ['https://exemplo.com/videoA.mp4'],
      ativo: true
    },
    {
      id_unico_externo: 'FZ-002',
      nome_produto: 'Produto Sincronizado B (Sem Estoque)',
      preco: 79.00,
      quantidade_estoque: 0,
      ean: '9876543210987',
      fotos: ['https://placehold.co/600x400/gray/white?text=Produto+B'],
      videos: [],
      ativo: false
    }
  ];
}

// Esta função será chamada quando o botão for clicado (via método POST)
export async function POST() {
  try {
    // Conecta ao Supabase usando as variáveis de ambiente (necessário configurar na Netlify)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use a Service Role Key para operações de escrita no backend
    );

    // 1. Busca os produtos da API externa
    const produtosExternos = await fetchProdutosExternos();

    // 2. Formata os dados para corresponder à nossa tabela 'produtos'
    const produtosParaSalvar = produtosExternos.map((p: any) => ({
      id_externo: p.id_unico_externo,
      nome: p.nome_produto,
      preco_base: p.preco,
      estoque: p.quantidade_estoque,
      codigo_barra: p.ean,
      imagens: p.fotos,
      videos: p.videos,
      ativo: p.ativo,
    }));

    if (produtosParaSalvar.length === 0) {
      return NextResponse.json({ message: 'Nenhum produto encontrado para sincronizar.' });
    }

    // 3. Salva no Supabase usando 'upsert'
    // Upsert: Se um produto com o mesmo 'id_externo' já existe, ele atualiza. Se não, ele cria.
    const { error } = await supabase
      .from('produtos')
      .upsert(produtosParaSalvar, { onConflict: 'id_externo' });

    if (error) {
      console.error('Erro ao salvar no Supabase:', error);
      throw new Error(`Erro do Supabase: ${error.message}`);
    }

    return NextResponse.json({ message: 'Sincronização concluída com sucesso!' });

  } catch (err: any) {
    console.error('Erro na API de sincronização:', err);
    return NextResponse.json({ error: err.message || 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}

