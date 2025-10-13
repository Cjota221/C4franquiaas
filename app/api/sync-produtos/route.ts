import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface ExternalProduct {
  id: string;
  nome: string;
  ativado: boolean;
  imagens: string[];
  variacoes?: { preco?: number }[];
  estoque?: { disponivel?: number };
}

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
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) throw new Error(`Erro na API FácilZap: ${response.statusText}`);

      const data = await response.json();
      const produtosDaPagina = data.data || [];

      if (produtosDaPagina.length > 0) {
        todosProdutos = todosProdutos.concat(produtosDaPagina);
        paginaAtual++;
      } else {
        continuarBuscando = false;
      }
    } catch (error) {
      console.error("Falha ao buscar uma página de produtos:", error);
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
      // Normalize to absolute URLs first
      const imagensAbs = (p.imagens || []).map((url) => {
        if (!url) return null;
        let correctedUrl = url;
        if (!correctedUrl.includes('://')) {
          correctedUrl = `https://arquivos.facilzap.app.br/${correctedUrl.replace(/^\//, '')}`;
        }
        return correctedUrl.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
      }).filter(Boolean) as string[];

      // Create proxy URLs that the frontend can use directly
      const imagensProxy = imagensAbs.map(u => `/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(u)}`);

      return {
        id_externo: p.id,
        nome: p.nome,
        preco_base: p.variacoes?.[0]?.preco ?? null,
        estoque: p.estoque?.disponivel ?? 0,
        // Save proxy URLs so frontend can directly use them as image src
        imagens: imagensProxy,
        imagem: imagensProxy[0] ?? null,
        ativo: p.ativado,
      };
    });

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
