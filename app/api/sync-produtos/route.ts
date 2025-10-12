import { NextResponse } from 'next/server';
import { syncProdutos } from '../../../lib/syncProdutos'; // Importa nossa função de sincronização direta

// Esta função lida com requisições POST para /api/sync-produtos
export async function POST(req: Request) {
  try {
    // Chama a função de sincronização que criamos na lib
    const resultado = await syncProdutos();

    // Se a sincronização falhar, retorna um erro
    if (!resultado.sucesso) {
      return NextResponse.json({ 
        message: 'Falha na sincronização', 
        error: resultado.erro 
      }, { status: 500 });
    }

    // Se for bem-sucedida, retorna uma mensagem de sucesso
    return NextResponse.json({ 
      message: 'Sincronização concluída com sucesso!', 
      total: resultado.total 
    });

  } catch (error: any) {
    // Captura qualquer outro erro inesperado
    return NextResponse.json({ 
      message: 'Erro interno no servidor', 
      error: error.message 
    }, { status: 500 });
  }
}

// Para conveniência, podemos fazer a rota GET chamar a POST
export async function GET(req: Request) {
    return POST(req);
}
