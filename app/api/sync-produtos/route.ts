import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { fetchProdutosFacilZap } from '@/lib/facilzapClient';

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

  const produtosExternos = await fetchProdutosFacilZap();

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
        preco_base: p.preco ?? null,
        estoque: p.estoque ?? 0,
        // Save proxy URLs so frontend can directly use them as image src
        imagens: imagensProxy,
        imagem: imagensProxy[0] ?? null,
        ativo: p.ativo,
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
