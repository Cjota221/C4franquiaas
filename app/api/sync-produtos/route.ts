import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Interface para garantir a tipagem dos dados vindos da API externa
interface ExternalProduct {
  // ATENÇÃO: Estes nomes de campos são exemplos.
  // Você DEVE ajustá-los para que correspondam EXATAMENTE
  // aos nomes dos campos que a API da FácilZap envia.
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  barcode?: string;
  images?: string[];
  videos?: string[];
  status?: string;
}

// Função para buscar os produtos da API externa REAL
async function fetchProdutosExternos(): Promise<ExternalProduct[]> {
  console.log("Buscando dados da API Externa Real...");

  const apiUrl = process.env.FACILZAP_API_URL;
  const apiToken = process.env.FACILZAP_TOKEN;

  if (!apiUrl || !apiToken) {
    throw new Error('As variáveis de ambiente da API FácilZap não estão configuradas no Netlify.');
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro na API FácilZap: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    
    // IMPORTANTE: Verifique se a API retorna um array direto ou um objeto com um array dentro.
    // Exemplo: Se os produtos vierem em data.products, você deve retornar data.products
    return data; 

  } catch (error) {
    console.error("Falha ao buscar produtos da FácilZap:", error);
    return []; // Retorna array vazio em caso de erro para não quebrar o resto do processo
  }
}


// Função principal da nossa API, chamada pelo botão "Sincronizar"
export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const produtosExternos = await fetchProdutosExternos();

    if (!produtosExternos || produtosExternos.length === 0) {
      return NextResponse.json({ message: 'Nenhum produto encontrado na API externa ou falha na comunicação.' });
    }

    // Mapeia os dados da API externa para a estrutura da nossa tabela 'produtos'
    const produtosParaSalvar = produtosExternos.map((p) => ({
      id_externo: p.id,
      nome: p.name,
      preco_base: p.price,
      estoque: p.stock_quantity,
      codigo_barra: p.barcode,
      imagens: p.images,
      videos: p.videos,
      ativo: p.status === 'active', // Exemplo de como converter um status de texto para booleano
    }));

    // Salva os dados no Supabase
    const { error } = await supabase
      .from('produtos')
      .upsert(produtosParaSalvar, { onConflict: 'id_externo' });

    if (error) {
      throw new Error(`Erro do Supabase: ${error.message}`);
    }

    return NextResponse.json({ message: `Sincronização concluída! ${produtosParaSalvar.length} produtos processados.` });

  } catch (err: unknown) {
    console.error('Erro na API de sincronização:', err);
    const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperado no servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

