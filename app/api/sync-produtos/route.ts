import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';

// --- TIPOS E INTERFACES ---

// Define a estrutura de um produto como vem da API da FácilZap (com base no seu debug)
type ExternalProduct = {
  id: string | number;
  nome: string;
  ativado: boolean;
  imagens: Array<{ file: string; url: string; variacoes: any[] | null }>;
  video?: string;
  cod_barras: { tipo: string; numero: string };
  estoque: { controlar_estoque: boolean; estoque: number };
  variacoes: Array<{
    id: number;
    ativada: boolean;
    nome: string;
    sku: string;
    cod_barras: { tipo: string; numero: string };
    estoque: { estoque: number };
  }>;
  catalogos: Array<{
    precos: {
      preco: number;
    };
  }>;
  [key: string]: unknown; // Permite outros campos que não listamos
};

// --- FUNÇÕES AUXILIARES DE "TRADUÇÃO" ---

/**
 * Corrige a URL da imagem vinda da API.
 */
function normalizarUrlImagem(url?: string): string | undefined {
  if (!url) return undefined;
  let s = url.trim();
  if (!s) return undefined;
  // Evita re-processar URLs já corrigidas
  if (s.includes('.netlify/functions/proxy-facilzap-image')) return s;
  
  // Corrige URLs que começam com //
  if (s.startsWith('//')) s = 'https:' + s;
  
  // Adiciona o domínio se faltar
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) {
    s = `https://arquivos.facilzap.app.br/${s.replace(/^\/+/, '')}`;
  }
  
  // Garante o domínio correto
  s = s.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
  s = s.replace(/^http:/i, 'https:');
  
  const param = encodeURIComponent(s);
  const PROXY_HOST = 'https://c4franquiaas.netlify.app';
  return `${PROXY_HOST}/.netlify/functions/proxy-facilzap-image?facilzap=${param}&url=${param}`;
}

/**
 * Mapeia um produto da FácilZap para o formato da nossa base de dados.
 * Esta é a função "tradutora" principal.
 */
function mapProdutoParaDB(p: ExternalProduct) {
  // Processa as variações para extrair estoque, código de barras e metadados
  let estoqueTotal = 0;
  const variacoesMeta: any[] = [];
  let primeiroCodigoBarras: string | null = null;

  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    for (const v of p.variacoes) {
      const estoqueDaVariacao = v.estoque?.estoque ?? 0;
      estoqueTotal += estoqueDaVariacao;

      const codigoBarrasDaVariacao = v.cod_barras?.numero?.trim() || null;
      if (!primeiroCodigoBarras && codigoBarrasDaVariacao) {
        primeiroCodigoBarras = codigoBarrasDaVariacao;
      }
      
      variacoesMeta.push({
        id: v.id,
        sku: v.sku,
        nome: v.nome,
        estoque: estoqueDaVariacao,
        codigo_barras: codigoBarrasDaVariacao,
      });
    }
  } else {
    // Se não há variações, pega o estoque do produto principal
    estoqueTotal = p.estoque?.estoque ?? 0;
  }

  // Tenta encontrar o preço no primeiro catálogo
  const precoBase = p.catalogos?.[0]?.precos?.preco ?? null;

  // Processa e corrige todas as imagens
  const imagensCorrigidas = (p.imagens || [])
    .map(img => normalizarUrlImagem(img.url))
    .filter((url): url is string => !!url);

  return {
    id_externo: String(p.id),
    nome: p.nome,
    preco_base: precoBase,
    estoque: estoqueTotal,
    ativo: p.ativado && estoqueTotal > 0,
    imagem: imagensCorrigidas[0] ?? null, // Pega a primeira imagem como principal
    imagens: imagensCorrigidas,
    codigo_barras: primeiroCodigoBarras,
    variacoes_meta: variacoesMeta,
    last_synced_at: new Date().toISOString(),
  };
}

// --- LÓGICA DA API ---

export async function POST(request: NextRequest) {
  console.log("--- INÍCIO DA SINCRONIZAÇÃO COMPLETA DE PRODUTOS ---");

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const apiToken = process.env.FACILZAP_TOKEN;
    if (!apiToken) throw new Error('FACILZAP_TOKEN não configurado no Netlify.');

    const client = axios.create({
      baseURL: 'https://api.facilzap.app.br',
      timeout: 15000,
      headers: { 
        'Authorization': `Bearer ${apiToken}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
    });

    const todosOsProdutos: any[] = [];
    let paginaAtual = 1;
    const LIMITE_DE_PAGINAS = 100; // Trava de segurança para evitar loops infinitos

    // Busca produtos página por página até não haver mais
    while (paginaAtual <= LIMITE_DE_PAGINAS) {
      console.log(`Buscando produtos da página ${paginaAtual}...`);
      const { data } = await client.get(`/produtos?page=${paginaAtual}&length=100`);
      
      const produtosDaPagina = data?.data || [];
      if (produtosDaPagina.length === 0) {
        console.log("Nenhum produto encontrado nesta página. Fim da busca.");
        break; // Encerra o loop se não houver mais produtos
      }
      
      todosOsProdutos.push(...produtosDaPagina);
      paginaAtual++;
    }

    if (todosOsProdutos.length === 0) {
      return NextResponse.json({ message: 'Nenhum produto encontrado na API da FácilZap.' });
    }
    console.log(`Total de ${todosOsProdutos.length} produtos encontrados na API. Mapeando para o formato do banco...`);

    // "Traduz" todos os produtos para o formato do nosso banco de dados
    const produtosParaSalvar = todosOsProdutos.map(mapProdutoParaDB);

    // Salva os produtos no Supabase em lotes para evitar sobrecarga
    const BATCH_SIZE = 50;
    for (let i = 0; i < produtosParaSalvar.length; i += BATCH_SIZE) {
      const lote = produtosParaSalvar.slice(i, i + BATCH_SIZE);
      console.log(`Enviando lote de ${lote.length} produtos para o Supabase...`);
      const { error } = await supabase.from('produtos').upsert(lote, { onConflict: 'id_externo' });
      if (error) {
        console.error('Erro detalhado do Supabase ao salvar lote:', error);
        throw new Error(`Erro do Supabase: ${error.message}`);
      }
    }

    console.log("--- FIM DA SINCRONIZAÇÃO - SUCESSO ---");
    return NextResponse.json({ message: `Sincronização concluída! ${produtosParaSalvar.length} produtos processados.` });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro inesperado no servidor.';
    console.error('--- ERRO CRÍTICO NA SINCRONIZAÇÃO ---', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

