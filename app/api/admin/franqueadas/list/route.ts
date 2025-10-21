import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

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

    let query = supabase
      .from('franqueadas')
      .select('*')
      .order('criado_em', { ascending: false });

    // Aplicar filtro de status se não for "todos"
    if (statusFilter !== 'todos') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[api/admin/franqueadas/list] Erro:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[api/admin/franqueadas/list] ${data?.length || 0} franqueadas carregadas (filtro: ${statusFilter})`);

    return NextResponse.json({ data: data || [] }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    console.error('[api/admin/franqueadas/list] Erro geral:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
