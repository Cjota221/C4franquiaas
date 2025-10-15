import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';

// Função para buscar os detalhes de UM produto na API da FácilZap
async function fetchProdutoFacilZapPorId(id: string) {
  const apiToken = process.env.FACILZAP_TOKEN;
  if (!apiToken) {
    console.error('FACILZAP_TOKEN não configurado no ambiente.');
    return null;
  }
  
  try {
    const apiUrl = `https://api.facilzap.app.br/produtos/${id}`;
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    // A API de detalhes pode retornar o produto dentro de uma chave "data"
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`Falha ao buscar detalhes do produto ${id} na FácilZap:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Busca o produto na nossa base de dados pelo ID interno ou externo
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .or(`id.eq.${id},id_externo.eq.${id}`)
      .limit(1);

    if (error) {
      console.error('[api/produtos/:id] Erro no Supabase:', error);
      return NextResponse.json({ error: 'Erro ao buscar produto no banco de dados.' }, { status: 500 });
    }

    const produtoDoBanco = Array.isArray(data) && data.length > 0 ? data[0] : null;
    
    // Se encontrarmos o produto, busca os detalhes mais recentes na FácilZap para comparação
    let detalhesDaFacilzap: unknown = null;
    const idExterno = produtoDoBanco?.id_externo ?? id;
    if (idExterno) {
        detalhesDaFacilzap = await fetchProdutoFacilZapPorId(String(idExterno));
    }

    return NextResponse.json({ 
        produto: produtoDoBanco, 
        facilzap: detalhesDaFacilzap 
    }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[api/produtos/:id] Erro geral:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

