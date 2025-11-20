import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// 🔐 Usar cliente ADMIN para garantir permissão de escrita (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ProdutoDaAPI {
  id: string | number;
  nome: string;
  preco: number;
  estoque: unknown; // ⚠️ Pode vir number, string ou objeto
  imagem: string;
}

/**
 * 🛡️ Função para normalizar o valor do estoque (ESSENCIAL)
 * A API FácilZap pode retornar:
 * - number: 15
 * - string: "15"
 * - object: { disponivel: 15, estoque: 15 }
 */
function normalizeEstoque(estoqueField: unknown): number {
  // Se já é número válido
  if (typeof estoqueField === 'number' && Number.isFinite(estoqueField)) {
    return estoqueField >= 0 ? estoqueField : 0;
  }
  
  // Se é string, limpar e converter
  if (typeof estoqueField === 'string') {
    const parsed = parseFloat(estoqueField.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }
  
  // Se é objeto, tentar extrair valor de campos conhecidos
  if (estoqueField && typeof estoqueField === 'object') {
    const obj = estoqueField as Record<string, unknown>;
    // Tenta encontrar o valor em vários campos possíveis
    const disponivel = obj.disponivel ?? obj.estoque ?? obj.quantidade ?? obj.qty ?? obj.stock;
    return normalizeEstoque(disponivel);
  }
  
  // Fallback: retorna 0
  return 0;
}

export async function syncProdutos() {
  console.log("🔄 Iniciando sincronização manual de produtos...");
  
  try {
    // Buscar produtos na API FácilZap
    const response = await axios.get("https://api.facilzap.app.br/produtos", {
      headers: { 
        Authorization: `Bearer ${process.env.FACILZAP_TOKEN}` 
      },
      timeout: 15000, // 15s timeout
    });

    const produtosDaAPI: ProdutoDaAPI[] = response.data.data || response.data; // Tratamento para .data array

    if (!produtosDaAPI || (Array.isArray(produtosDaAPI) && produtosDaAPI.length === 0)) {
      console.warn("⚠️ Nenhum produto retornado pela API.");
      return { sucesso: true, total: 0, message: "Nenhum produto encontrado na API." };
    }

    const listaProdutos = Array.isArray(produtosDaAPI) ? produtosDaAPI : [];
    console.log(`📦 ${listaProdutos.length} produtos encontrados. Processando...`);

    // Preparar payload normalizado
    const produtosParaSalvar = listaProdutos.map((produto) => {
      const estoqueNormalizado = normalizeEstoque(produto.estoque);
      const idString = String(produto.id);

      return {
        id_externo: idString,
        facilzap_id: idString, // 🔑 Garante que ambos os IDs estejam preenchidos
        nome: produto.nome,
        preco_base: produto.preco,
        estoque: estoqueNormalizado,
        imagem: produto.imagem,
        ativo: true,
        sincronizado_facilzap: true,
        ultima_sincronizacao: new Date().toISOString(),
      };
    });

    console.log(`💾 Salvando ${produtosParaSalvar.length} produtos no banco...`);
    console.log(`📊 Exemplo de produto normalizado:`, produtosParaSalvar[0]);

    // Salvar no Supabase usando upsert
    const { error } = await supabaseAdmin
      .from('produtos')
      .upsert(produtosParaSalvar, { 
        onConflict: 'id_externo', // 🔑 Mantemos id_externo como chave principal de confiança
        ignoreDuplicates: false 
      });

    if (error) {
      console.error("❌ Erro no Upsert:", error);
      throw error;
    }

    console.log(`✅ Sucesso! ${produtosParaSalvar.length} produtos processados.`);
    
    return { 
      sucesso: true, 
      total: produtosParaSalvar.length
    };
    
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : (err && typeof err === 'object' && 'response' in err) 
      ? (err as { response?: { data?: unknown } }).response?.data || "Erro desconhecido"
      : "Erro desconhecido";
    console.error("❌ Erro fatal na sincronização:", errorMessage);
    
    // Log detalhado do erro
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      if (axiosErr.response) {
        console.error("📡 Status:", axiosErr.response.status);
        console.error("📡 Data:", axiosErr.response.data);
      }
    }
    
    return { sucesso: false, erro: errorMessage };
  }
}
