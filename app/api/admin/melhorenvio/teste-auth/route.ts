import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsbW14c2R4bW92bGtwZnFhbXZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzkyMDEwMSwiZXhwIjoyMDM5NDk2MTAxfQ.RM7IPQE-PgXW6xAZugFqJU1bCpcUb7xrOvPXOApOXuQ';

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Buscar token do banco
    const { data: config } = await supabase
      .from('config_melhorenvio')
      .select('access_token')
      .eq('id', 1)
      .single();
    
    const token = config?.access_token;
    
    if (!token) {
      return NextResponse.json({
        authenticated: false,
        error: 'Token não encontrado no banco de dados'
      }, { status: 401 });
    }

    const isSandbox = process.env.NEXT_PUBLIC_MELHORENVIO_SANDBOX === 'true';
    const baseUrl = isSandbox 
      ? 'https://sandbox.melhorenvio.com.br/api/v2'
      : 'https://melhorenvio.com.br/api/v2';

    const response = await fetch(`${baseUrl}/me`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        authenticated: false,
        error: `Erro na autenticação (${response.status})`,
        details: errorText
      }, { status: response.status });
    }

    const userData = await response.json();

    return NextResponse.json({
      authenticated: true,
      user: userData
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({
      authenticated: false,
      error: errorMessage
    }, { status: 500 });
  }
}
