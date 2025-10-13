import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Tipagem para os produtos que recebemos da API externa
interface ExternalProduct {
  id_unico_externo: string;
  nome_produto: string;
  preco: number;
  quantidade_estoque: number;
  ean?: string;
  fotos?: string[];
  videos?: string[];
  ativo?: boolean;
}

// Função para buscar os produtos da API externa (exemplo)
async function fetchProdutosExternos(): Promise<ExternalProduct[]> {
  console.log('Buscando dados da API Externa...');
  return [
    {
      id_unico_externo: 'FZ-001',
      nome_produto: 'Produto Sincronizado A',
      preco: 149.90,
      quantidade_estoque: 35,
      ean: '1234567890123',
      fotos: [
        'https://placehold.co/600x400/DB1472/white?text=Produto+A',
        'https://placehold.co/600x400/DB1472/white?text=Produto+A2'
      ],
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

// Função chamada via método POST
export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const produtosExternos = await fetchProdutosExternos();

    const produtosParaSalvar = produtosExternos.map((p) => ({
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

    const { error } = await supabase
      .from('produtos')
      .upsert(produtosParaSalvar, { onConflict: 'id_externo' });

    if (error) {
      console.error('Erro ao salvar no Supabase:', error);
      throw new Error(`Erro do Supabase: ${error.message}`);
    }

    return NextResponse.json({ message: 'Sincronização concluída com sucesso!' });

  } catch (err: unknown) {
    console.error('Erro na API de sincronização:', err);

    // Tratamento seguro do erro
    let errorMessage = 'Ocorreu um erro no servidor.';
    if (err instanceof Error) {
      errorMessage = err.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
