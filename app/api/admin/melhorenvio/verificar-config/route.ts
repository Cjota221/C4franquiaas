import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsbW14c2R4bW92bGtwZnFhbXZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzkyMDEwMSwiZXhwIjoyMDM5NDk2MTAxfQ.RM7IPQE-PgXW6xAZugFqJU1bCpcUb7xrOvPXOApOXuQ';

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data, error } = await supabase
      .from('config_melhorenvio')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Configuração não encontrada no banco',
        details: error.message
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      config: {
        id: data.id,
        token_type: data.token_type,
        has_access_token: !!data.access_token,
        access_token: data.access_token?.substring(0, 30) + '...',
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        scopes: data.scopes,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
