import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Interface que agora corresponde à documentação da API FácilZap
interface ExternalProduct {
  id: string;
  nome: string;
  ativado: boolean;
  imagens: string[];
  // O campo de variações contém o preço
  variacoes?: { preco?: number }[]; 
  estoque: {
    disponivel: number;
  };
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
    const apiUrlComPaginacao = `${apiBaseUrl}/produtos?page=1&length=100`;

    const response = await fetch(apiUrlComPaginacao, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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

    // CORREÇÃO: Mapeamento ajustado com base na estrutura real da sua tabela Supabase
    const produtosParaSalvar = produtosExternos.map((p) => ({
      id_externo: p.id,
      nome: p.nome,
      preco_base: p.variacoes?.[0]?.preco ?? null, // Pega o preço da primeira variação
      estoque: p.estoque?.disponivel ?? 0,
      imagem: p.imagens?.[0] ?? null, // Salva apenas a primeira imagem
      ativo: p.ativado,
      // Os campos 'videos' e 'codigo_barra' foram removidos, pois não existem na tabela
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
