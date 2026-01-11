"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, Eye, Play, AlertCircle } from "lucide-react";

interface PreviewData {
  stats: {
    revendedoras_afetadas: number;
    total_produtos: number;
  };
  detalhes: Array<{
    revendedora_id: string;
    store_name: string;
    slug: string;
    status: string;
    is_active: boolean;
    quantidade_produtos: number;
    produtos: Array<{ id: string; nome: string; product_id: string }>;
  }>;
}

interface ExecuteResult {
  stats: {
    desativados: number;
    revendedoras_afetadas: number;
  };
  log_por_revendedora: Record<string, number>;
}

export default function DesativarSemMargemPage() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedRevendedora, setExpandedRevendedora] = useState<string | null>(null);

  // Fazer preview
  async function fazerPreview() {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await fetch("/api/admin/produtos/desativar-sem-margem");
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Erro ao fazer preview");
      }
      
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  // Executar desativação
  async function executarDesativacao() {
    if (!preview) return;
    
    const confirmacao = window.confirm(
      `ATENÇÃO!\n\nVocê está prestes a desativar ${preview.stats.total_produtos} produtos de ${preview.stats.revendedoras_afetadas} revendedoras.\n\nEssa ação NÃO afeta a tabela central de produtos, apenas a vinculação das revendedoras.\n\nDeseja continuar?`
    );
    
    if (!confirmacao) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/admin/produtos/desativar-sem-margem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmar: true }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Erro ao executar");
      }
      
      setResult(data);
      setPreview(null); // Limpa preview após execução
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          Desativar Produtos Sem Margem
        </h1>
        <p className="text-gray-600 mt-2">
          Esta ferramenta desativa produtos que estão ATIVOS nas lojas das revendedoras, 
          mas que não têm margem de lucro configurada.
        </p>
      </div>

      {/* Aviso importante */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800">Importante</h3>
            <ul className="text-sm text-amber-700 mt-1 space-y-1">
              <li>• Esta ação NÃO afeta a tabela central de produtos</li>
              <li>• Apenas a vinculação (reseller_products) será alterada</li>
              <li>• Produtos onde margin_percent = NULL ou 0 serão desativados</li>
              <li>• Produtos com custom_price válido NÃO serão afetados</li>
              <li>• As revendedoras verão um alerta para configurar as margens</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botão de Preview */}
      {!preview && !result && (
        <button
          onClick={fazerPreview}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
          {loading ? "Analisando..." : "Ver Preview"}
        </button>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="mt-6 space-y-6">
          {/* Stats do Preview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-500">Revendedoras Afetadas</p>
              <p className="text-3xl font-bold text-amber-600">
                {preview.stats.revendedoras_afetadas}
              </p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-500">Produtos a Desativar</p>
              <p className="text-3xl font-bold text-red-600">
                {preview.stats.total_produtos}
              </p>
            </div>
          </div>

          {/* Lista por Revendedora */}
          {preview.detalhes.length > 0 && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-800">Detalhes por Revendedora</h3>
              </div>
              <div className="divide-y">
                {preview.detalhes.map((r) => (
                  <div key={r.revendedora_id} className="p-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedRevendedora(
                        expandedRevendedora === r.revendedora_id ? null : r.revendedora_id
                      )}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{r.store_name}</p>
                        <p className="text-sm text-gray-500">/{r.slug}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {r.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                        <span className="text-lg font-semibold text-red-600">
                          {r.quantidade_produtos} produto(s)
                        </span>
                      </div>
                    </div>
                    
                    {/* Lista de produtos expandida */}
                    {expandedRevendedora === r.revendedora_id && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-200">
                        <ul className="text-sm text-gray-600 space-y-1">
                          {r.produtos.slice(0, 10).map((p) => (
                            <li key={p.id}>• {p.nome}</li>
                          ))}
                          {r.produtos.length > 10 && (
                            <li className="text-gray-400">
                              ... e mais {r.produtos.length - 10} produtos
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center gap-4">
            <button
              onClick={executarDesativacao}
              disabled={loading || preview.stats.total_produtos === 0}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {loading ? "Executando..." : "Executar Desativação"}
            </button>
            
            <button
              onClick={() => setPreview(null)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="mt-6 space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-xl font-bold text-green-800">Concluído!</h3>
                <p className="text-green-700">
                  {result.stats.desativados} produtos foram desativados em {result.stats.revendedoras_afetadas} revendedoras.
                </p>
              </div>
            </div>
            
            {/* Log por revendedora */}
            <div className="mt-4 pt-4 border-t border-green-200">
              <h4 className="text-sm font-semibold text-green-800 mb-2">Resumo por revendedora:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(result.log_por_revendedora).map(([nome, qtd]) => (
                  <div key={nome} className="text-sm bg-white px-3 py-2 rounded border border-green-100">
                    <span className="text-gray-600">{nome}:</span>{" "}
                    <span className="font-semibold text-green-700">{qtd}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Próximos passos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Próximos passos:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>As revendedoras verão um alerta no painel delas</li>
              <li>Elas poderão ver os produtos sem margem usando o filtro</li>
              <li>Ao configurar a margem, poderão reativar os produtos</li>
            </ol>
          </div>

          <button
            onClick={() => {
              setResult(null);
              fazerPreview();
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fazer Novo Preview
          </button>
        </div>
      )}
    </div>
  );
}
