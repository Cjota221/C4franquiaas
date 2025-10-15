import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import axios from 'axios';

// Tipos que correspondem à estrutura real da API, baseados no seu debug
type VariacaoAPI = {
  id: number;
  nome: string;
  sku: string;
  cod_barras: { tipo: string; numero: string };
  estoque: { estoque: number };
  [key: string]: unknown;
};

type CatalogoAPI = {
  precos?: {
    preco?: number;
  };
  [key: string]: unknown;
};

type ExternalProduct = {
  id: string;
  nome: string;
  ativado: boolean;
  imagens: { url: string }[];
  variacoes: VariacaoAPI[];
  cod_barras: { tipo: string; numero: string };
  catalogos: CatalogoAPI[];
  [key: string]: unknown;
};


// Função para buscar TODOS os produtos da API externa, página por página
async function fetchTodosProdutosExternos(): Promise<ExternalProduct[]> {
  const apiBaseUrl = 'https://api.facilzap.app.br';
  const apiToken = process.env.FACILZAP_TOKEN;
  let todosProdutos: ExternalProduct[] = [];
  let paginaAtual = 1;
  const itensPorPagina = 100;
  let continuarBuscando = true;

  if (!apiToken) {
    throw new Error('A variável de ambiente FACILZAP_TOKEN não está configurada.');
  }

  while (continuarBuscando) {
    try {
      const apiUrl = `${apiBaseUrl}/produtos?page=${paginaAtual}&length=${itensPorPagina}`;
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const produtosDaPagina = response.data?.data || [];

      if (produtosDaPagina.length > 0) {
        todosProdutos = todosProdutos.concat(produtosDaPagina);
        paginaAtual++;
      } else {
        continuarBuscando = false;
      }
    } catch (error) {
      console.error("Falha ao buscar uma página de produtos da FácilZap:", error);
      continuarBuscando = false;
    }
  }
  return todosProdutos;
}


export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const produtosExternos = await fetchTodosProdutosExternos();

    if (!produtosExternos || produtosExternos.length === 0) {
      return NextResponse.json({ message: 'Nenhum produto encontrado para sincronizar.' });
    }

    const produtosParaSalvar = produtosExternos.map((p) => {
      // --- NOVA LÓGICA DE TRADUÇÃO INTELIGENTE ---

      // 1. Soma o estoque de todas as variações
      const estoqueTotal = (p.variacoes || []).reduce((acc, v) => {
        return acc + (v.estoque?.estoque || 0);
      }, 0);

      // 2. Busca o primeiro código de barras válido nas variações
      const primeiroCodigoDeBarras = 
        (p.variacoes || []).map(v => v.cod_barras?.numero).find(num => num) || p.cod_barras?.numero || null;

      // 3. Busca o preço no primeiro catálogo
      const precoBase = p.catalogos?.[0]?.precos?.preco ?? null;

      // 4. Mapeia todas as imagens
      const imagensUrls = (p.imagens || []).map(img => img.url);

      // 5. Guarda os metadados das variações para uso futuro
      const variacoesMeta = (p.variacoes || []).map(v => ({
        id: v.id,
        nome: v.nome,
        sku: v.sku,
        estoque: v.estoque?.estoque || 0,
        codigo_barras: v.cod_barras?.numero || null
      }));

      return {
        id_externo: p.id,
        nome: p.nome,
        preco_base: precoBase,
        estoque: estoqueTotal,
        imagens: imagensUrls,
        ativo: p.ativado,
        codigo_barras: primeiroCodigoDeBarras,
        variacoes_meta: variacoesMeta
      };
    });

    const { error } = await supabase
      .from('produtos')
      .upsert(produtosParaSalvar, { onConflict: 'id_externo' });

    if (error) {
      console.error("Erro do Supabase ao salvar:", error);
      throw new Error(`Erro do Supabase: ${error.message}`);
    }

    return NextResponse.json({ message: `Sincronização concluída! ${produtosParaSalvar.length} produtos processados.` });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
    console.error("Erro fatal na sincronização:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

