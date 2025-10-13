import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Interface que agora corresponde à documentação da API FácilZap
interface ExternalProduct {
  id: string;
  nome: string;
  ativado: boolean;
  imagens: string[];
  video?: string; // Vídeo é opcional e vem como string
  cod_barras: string[];
  estoque: {
    // ATENÇÃO: Confirme o nome exato do campo para a quantidade disponível
    disponivel: number;
  };
  // ATENÇÃO: O campo de PREÇO não foi encontrado na listagem de produtos.
  // Pode ser necessário buscar em outro lugar ou ele pode estar em 'variacoes'.
  // Por enquanto, o preço não será sincronizado.
}

// Função para buscar os produtos da API externa REAL
async function fetchProdutosExternos(): Promise<ExternalProduct[]> {
  console.log("Buscando dados da API Externa Real...");

  const apiBaseUrl = 'https://api.facilzap.app.br';
  const apiToken = process.env.FACILZAP_TOKEN;

  if (!apiToken) {
    throw new Error('A variável de ambiente FACILZAP_TOKEN não está configurada no Netlify.');
  }

  try {
    // MUDANÇA 1: Adicionada paginação para buscar os primeiros 100 produtos.
    const apiUrlComPaginacao = `${apiBaseUrl}/produtos?page=1&length=100`;

    const response = await fetch(apiUrlComPaginacao, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // MUDANÇA 2: Adicionado o "disfarce" de navegador (User-Agent).
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro na API FácilZap: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    
    return data.data || []; 

  } catch (error) {
    console.error("Falha ao buscar produtos da FácilZap:", error);
    return [];
  }
}


// Função principal da nossa API
export async function POST() {
  console.log("--- INÍCIO DA SINCRONIZAÇÃO DE PRODUTOS ---");

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const produtosExternos = await fetchProdutosExternos();

    if (!produtosExternos || produtosExternos.length === 0) {
      return NextResponse.json({ message: 'Nenhum produto encontrado na API externa.' });
    }

    // Mapeia os dados REAIS da API para a nossa tabela 'produtos'
    const produtosParaSalvar = produtosExternos.map((p) => ({
      id_externo: p.id,
      nome: p.nome,
      // preco_base: p.preco, // CAMPO DE PREÇO AINDA NÃO ENCONTRADO
      estoque: p.estoque?.disponivel ?? 0, // Acessa o estoque dentro do objeto
      codigo_barra: p.cod_barras?.[0] ?? null, // Pega o primeiro código de barras da lista
      imagens: p.imagens,
      videos: p.video ? [p.video] : [], // Transforma a string de vídeo em uma lista
      ativo: p.ativado,
    }));

    const { error } = await supabase
      .from('produtos')
      .upsert(produtosParaSalvar, { onConflict: 'id_externo' });

    if (error) {
      throw new Error(`Erro do Supabase: ${error.message}`);
    }

    return NextResponse.json({ message: `Sincronização concluída! ${produtosParaSalvar.length} produtos processados.` });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

