import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

type Loja = {
  id: string;
  nome: string;
  dominio: string;
  logo: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  ativo: boolean;
  produtos_ativos: number;
  criado_em: string;
};

type FranqueadaComLojas = {
  id: string;
  nome: string;
  email: string;
  status: string;
  criado_em: string;
  lojas?: Loja | Loja[] | null;
  telefone?: string | null;
  cpf?: string | null;
  cidade?: string | null;
  estado?: string | null;
  aprovado_em?: string | null;
  observacoes?: string | null;
  vendas_total?: number;
  comissao_acumulada?: number;
};

export async function GET(request: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    
    // Pegar filtro de status da query string
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'todos';

    // Verificar se a tabela lojas existe
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'lojas')
      .eq('table_schema', 'public')
      .single();

    const lojasExists = !!tables;

    // Query com ou sem join dependendo se lojas existe
    let query = supabase
      .from('franqueadas')
      .select(lojasExists ? `
        *,
        lojas (
          id,
          nome,
          dominio,
          logo,
          cor_primaria,
          cor_secundaria,
          ativo,
          produtos_ativos,
          criado_em
        )
      ` : '*')
      .order('criado_em', { ascending: false });

    // Aplicar filtro de status
    if (statusFilter === 'ativa') {
      // Franqueadas aprovadas com loja ativa
      query = query.eq('status', 'aprovada');
    } else if (statusFilter === 'inativa') {
      // Franqueadas aprovadas com loja inativa
      query = query.eq('status', 'aprovada');
    } else if (statusFilter !== 'todos') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[api/admin/franqueadas/list] Erro:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filtrar manualmente ativa/inativa se necessário (apenas se lojas existe)
    let franqueadas = (data || []) as unknown as FranqueadaComLojas[];
    if (lojasExists) {
      if (statusFilter === 'ativa') {
        franqueadas = franqueadas.filter(f => {
          const lojas = Array.isArray(f.lojas) ? f.lojas[0] : f.lojas;
          return lojas && (lojas as Loja).ativo;
        });
      } else if (statusFilter === 'inativa') {
        franqueadas = franqueadas.filter(f => {
          const lojas = Array.isArray(f.lojas) ? f.lojas[0] : f.lojas;
          return lojas && !(lojas as Loja).ativo;
        });
      }
    }

    // Normalizar estrutura (lojas sempre como objeto único ou null)
    const franqueadasNormalizadas = franqueadas.map(f => ({
      ...f,
      loja: lojasExists 
        ? (Array.isArray(f.lojas) ? f.lojas[0] || null : f.lojas || null)
        : null
    }));

    console.log(`[api/admin/franqueadas/list] ${franqueadasNormalizadas.length} franqueadas carregadas (filtro: ${statusFilter}, lojas: ${lojasExists ? 'existe' : 'não existe'})`);

    return NextResponse.json({ data: franqueadasNormalizadas }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    console.error('[api/admin/franqueadas/list] Erro geral:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
