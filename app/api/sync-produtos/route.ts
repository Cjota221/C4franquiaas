import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Interface baseada na documentação da FácilZap
interface ExternalProduct {
  id: string;
  nome: string;
  ativado: boolean;
  imagens: string[];
  video?: string;
  cod_barras: string[];
  estoque?: {
    disponivel: number;
  };
  variacoes?: {
    preco: number;
  }[];
}

// Função para buscar os produtos da API FácilZap
async function fetchProdutosExternos(): Promise<ExternalProduct[]> {
  console.log("Buscando dados da API Externa Real...");

  const apiBaseUrl = 'https://api.facilzap.app.br';
  const apiToken = process.env.FACILZAP_TOKEN;

  if (!apiToken) {
    throw new Error('A variável de ambiente FACILZAP_TOKEN não está configurada.');
  }

  const apiUrl = `${apiBaseUrl}/produtos?page=1&length=100`;

  const response = await fetch(apiUrl, {
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

  if (!data || !Array.isArray(data.data)) {
    throw new Error("Resposta inesperada da API FácilZap.");
  }

  return data.data;
}

// Função principal chamada via POST
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

    const produtosParaSalvar = produtosExternos.map((p) => ({
      id_externo: p.id,
      nome: p.nome,
      preco_base: p.variacoes?.[0]?.preco ?? null,
      estoque: p.estoque?.disponivel ?? 0,
      codigo_barra: p.cod_barras?.[0] ?? null,
      imagens: p.imagens,
      videos: p.video ? [p.video] : [],
      ativo: p.ativado,
    }));

    const { error } = await supabase
      .from('produtos')
      .upsert(produtosParaSalvar, { onConflict: 'id_externo' });

    if (error) {
      throw new Error(`Erro do Supabase: ${error.message}`);
    }

    return NextResponse.json({
      message: `Sincronização concluída! ${produtosParaSalvar.length} produtos processados.`
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
    console.error("Erro na sincronização:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}