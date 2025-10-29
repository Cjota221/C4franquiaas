"use client";
import React, { useEffect, useState } from 'react';
import { useEnvioecom } from '@/hooks/useEnvioecom';
import { RastreamentoModal } from '@/components/admin/RastreamentoModal';
import { Button } from '@/components/ui/button';
import type { EtiquetaRequest, EnderecoCompleto } from '@/types/envioecom';

type Cliente = {
  nome?: string | null;
  telefone?: string | null;
  endereco?: string | null;
};

type Pedido = {
  id: string;
  cliente?: Cliente | null;
  franqueada_id: string;
  valor_total: number;
  status: string;
  etiqueta?: string | null;
  criado_em: string;
};

type ItemPedido = {
  id: string;
  pedido_id: string;
  produto_id: string;
  variacao: string;
  quantidade: number;
  codigo_barra?: string | null;
  status: string;
};

type ListResponse = {
  pedidos?: Pedido[];
  total?: number;
  itens?: ItemPedido[];
};

function usePoll<T = unknown>(url: string | null, interval = 5000) {
  const [data, setData] = useState<T | null>(null);
  const fetchData = React.useCallback(async () => {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      setData(json as T);
    } catch {
      // ignore
    }
  }, [url]);
  useEffect(() => {
    if (!url) return;
    fetchData();
    const id = setInterval(fetchData, interval);
    return () => clearInterval(id);
  }, [url, interval, fetchData]);
  return { data, mutate: fetchData };
}

function statusColor(status: string) {
  switch (status) {
    case 'em_separacao': return 'bg-yellow-300 text-yellow-900';
    case 'separado': return 'bg-blue-300 text-blue-900';
    case 'enviado': return 'bg-green-300 text-green-900';
    case 'entregue': return 'bg-gray-200 text-gray-700';
    default: return 'bg-gray-100';
  }
}

export default function AdminVendasPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [scanValue, setScanValue] = useState('');
  const [perPage] = useState(20);

  // Estados Envioecom
  const [showRastreamento, setShowRastreamento] = useState(false);
  const [codigoRastreioAtual, setCodigoRastreioAtual] = useState('');
  const [gerandoEtiqueta, setGerandoEtiqueta] = useState(false);

  // Hook Envioecom
  const { gerarEtiqueta: gerarEtiquetaEnvioecom, isLoading: loadingEnvioecom } = useEnvioecom();

  const apiUrl = `/api/admin/vendas/list?page=${page}&per_page=${perPage}&status=${filter}&q=${encodeURIComponent(search)}`;
  const { data, mutate } = usePoll<ListResponse>(apiUrl, 5000);

  useEffect(() => {
    if (!selectedPedido) return;
    (async () => {
      const res = await fetch(`/api/admin/vendas/list?pedido_id=${selectedPedido.id}`);
      const json = await res.json();
      setItens(json.itens || []);
    })();
  }, [selectedPedido]);

  const openDetalhes = (pedido: Pedido) => {
    setSelectedPedido(pedido);
  };

  const startSeparacao = async (pedido: Pedido) => {
    await fetch('/api/admin/vendas/action', { method: 'POST', body: JSON.stringify({ action: 'start', pedido_id: pedido.id }) });
    mutate();
  };

  /**
   * Gerar Etiqueta via Envioecom
   * ⚠️ IMPORTANTE: Só deve ser chamado APÓS confirmação do pagamento
   */
  const gerarEtiquetaAutomatica = async (pedido: Pedido) => {
    // Validação: Verificar se pedido está pago
    if (pedido.status !== 'pago' && pedido.status !== 'separado') {
      alert('Atenção: Etiquetas só podem ser geradas para pedidos pagos ou em separação!');
      return;
    }

    if (!pedido.cliente) {
      alert('Erro: Dados do cliente não encontrados');
      return;
    }

    try {
      setGerandoEtiqueta(true);

      // Montar dados do destinatário
      const destinatario: EnderecoCompleto = {
        nome: pedido.cliente.nome || 'Cliente',
        telefone: pedido.cliente.telefone || '',
        endereco: pedido.cliente.endereco || '',
        numero: 'S/N', // TODO: Extrair do endereço
        bairro: '', // TODO: Adicionar campo no banco
        cidade: '', // TODO: Adicionar campo no banco
        estado: '', // TODO: Adicionar campo no banco
        cep: '', // TODO: Adicionar campo no banco
      };

      // Montar request
      const request: EtiquetaRequest = {
        servico_id: '', // Será selecionado via cotação
        remetente: {
          nome: 'C4 Franquias', // TODO: Obter da configuração
          telefone: '', // TODO: Configurar
          endereco: '', // TODO: Configurar
          numero: '', // TODO: Configurar
          bairro: '', // TODO: Configurar
          cidade: '', // TODO: Configurar
          estado: '', // TODO: Configurar
          cep: '', // TODO: Configurar
        },
        destinatario,
        pacotes: [
          {
            peso: 500, // TODO: Calcular peso real dos produtos
            altura: 10, // TODO: Calcular dimensões reais
            largura: 15,
            comprimento: 20,
            valor_declarado: Number(pedido.valor_total),
          },
        ],
        produtos: [], // TODO: Mapear itens do pedido
        numero_pedido: pedido.id,
      };

      const response = await gerarEtiquetaEnvioecom(request);

      // Salvar código de rastreio no banco
      await fetch('/api/admin/vendas/action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'label',
          pedido_id: pedido.id,
          etiqueta: response.codigo_rastreio,
        }),
      });

      // Abrir PDF da etiqueta
      window.open(response.url_etiqueta, '_blank');

      alert(`Etiqueta gerada com sucesso!\nCódigo de rastreio: ${response.codigo_rastreio}`);
      mutate();
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error);
      alert(`Erro ao gerar etiqueta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setGerandoEtiqueta(false);
    }
  };

  const abrirRastreamento = (codigoRastreio: string) => {
    setCodigoRastreioAtual(codigoRastreio);
    setShowRastreamento(true);
  };

  const concluirEnvio = async (pedido: Pedido) => {
    await fetch('/api/admin/vendas/action', { method: 'POST', body: JSON.stringify({ action: 'complete', pedido_id: pedido.id }) });
    mutate();
  };

  const onScan = async () => {
    if (!selectedPedido) return;
    const code = scanValue.trim();
    if (!code) return;
    await fetch('/api/admin/vendas/action', { method: 'POST', body: JSON.stringify({ action: 'bip', pedido_id: selectedPedido.id, codigo_barras: code }) });
    setScanValue('');
    // refresh itens and list
    const res = await fetch(`/api/admin/vendas/list?pedido_id=${selectedPedido.id}`);
    const json = await res.json();
    setItens(json.itens || []);
    mutate();
  };

  return (
    <div className="min-h-screen bg-[#FFF5FA] text-gray-800">
      <div className="flex">
        <aside className="hidden md:block md:w-64 md:p-4 md:border-r md:bg-white">
          <h2 className="text-xl font-bold">Filtros</h2>
          <div className="mt-4">
            <select value={filter} onChange={e => setFilter(e.target.value)} className="w-full p-2 border rounded">
              <option>Todos</option>
              <option>em_separacao</option>
              <option>separado</option>
              <option>enviado</option>
              <option>entregue</option>
            </select>
          </div>
          <div className="mt-4">
            <button onClick={() => mutate()} className="w-full py-2 bg-[#DB1472] text-white rounded">Atualizar</button>
          </div>
        </aside>

  <main className="flex-1 p-4 sm:p-6">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Vendas</h1>
              <p className="text-sm text-gray-600">Total: {data?.total ?? '—'}</p>
            </div>
            <div className="flex items-center gap-3">
              <input placeholder="Buscar" value={search} onChange={e => setSearch(e.target.value)} className="p-2 border rounded" />
              <button onClick={() => { setPage(1); mutate(); }} className="px-3 py-2 bg-[#F8B81F] rounded">Buscar</button>
            </div>
          </header>

          <div className="overflow-auto bg-white rounded shadow">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-3">Número do Pedido</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Franqueada</th>
                  <th className="p-3">Valor Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(data?.pedidos || []).map((p: Pedido) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-3">{p.id}</td>
                    <td className="p-3">{p.cliente?.nome ?? '—'}<br/><small className="text-gray-500">{p.cliente?.telefone ?? ''}</small></td>
                    <td className="p-3">{p.franqueada_id}</td>
                    <td className="p-3">R$ {Number(p.valor_total).toFixed(2)}</td>
                    <td className={`p-3 w-40 ${statusColor(p.status)}`}><span className="px-2 py-1 rounded">{p.status}</span></td>
                    <td className="p-3">{new Date(p.criado_em).toLocaleString()}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openDetalhes(p)} className="px-3 py-2 bg-white border rounded min-h-[44px]">Ver Detalhes</button>
                      <button onClick={() => startSeparacao(p)} className="px-3 py-2 bg-[#F8B81F] rounded min-h-[44px]">Iniciar Separação</button>
                      
                      {/* Botão Gerar Etiqueta - Desabilitado se não estiver pago */}
                      <button 
                        onClick={() => gerarEtiquetaAutomatica(p)} 
                        disabled={p.status !== 'pago' && p.status !== 'separado' || gerandoEtiqueta || loadingEnvioecom}
                        className={`px-3 py-2 rounded min-h-[44px] ${
                          p.status !== 'pago' && p.status !== 'separado' 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-[#DB1472] text-white hover:bg-[#c01163]'
                        }`}
                        title={
                          p.status !== 'pago' && p.status !== 'separado'
                            ? 'Etiqueta só pode ser gerada após confirmação do pagamento'
                            : 'Gerar etiqueta via Envioecom'
                        }
                      >
                        {gerandoEtiqueta ? 'Gerando...' : 'Gerar Etiqueta'}
                      </button>

                      {/* Botão Rastreamento - Só aparece se tiver código */}
                      {p.etiqueta && (
                        <button 
                          onClick={() => abrirRastreamento(p.etiqueta!)} 
                          className="px-3 py-2 bg-blue-600 text-white rounded min-h-[44px] hover:bg-blue-700"
                          title="Rastrear pedido"
                        >
                          🔍 Rastrear
                        </button>
                      )}

                      <button onClick={() => concluirEnvio(p)} className="px-3 py-2 bg-green-600 text-white rounded min-h-[44px]">Concluir Envio</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <button onClick={() => setPage(Math.max(1, page-1))} className="px-3 py-1 border rounded">Anterior</button>
              <span className="px-3">Página {page}</span>
              <button onClick={() => setPage(page+1)} className="px-3 py-1 border rounded">Próxima</button>
            </div>
            <div>
              <button onClick={() => mutate()} className="px-3 py-1 border rounded">Recarregar</button>
            </div>
          </div>
        </main>
      </div>

      {/* Detalhes Modal */}
      {selectedPedido && (
        <div className="fixed inset-0 bg-black/40 flex">
    <div className="fixed inset-0 md:ml-auto md:relative md:w-2/5 bg-white p-4 md:p-6 overflow-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Pedido {selectedPedido.id}</h2>
              <button onClick={() => setSelectedPedido(null)} className="text-gray-600">Fechar</button>
            </div>

            <section className="mt-4">
              <h3 className="font-semibold">Cliente</h3>
              <p>{selectedPedido.cliente?.nome}</p>
              <p>{selectedPedido.cliente?.endereco}</p>
              <p>{selectedPedido.cliente?.telefone}</p>
            </section>

            <section className="mt-4">
              <h3 className="font-semibold">Itens</h3>
              <table className="w-full mt-2">
                <thead>
                  <tr className="text-left border-b">
                    <th className="p-2">Variação</th>
                    <th className="p-2">Quantidade</th>
                    <th className="p-2">Código de Barras</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map(it => (
                    <tr key={it.id} className="border-b">
                      <td className="p-2">{it.variacao}</td>
                      <td className="p-2">{it.quantidade}</td>
                      <td className="p-2">{it.codigo_barra}</td>
                      <td className="p-2">{it.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mt-4">
              <h3 className="font-semibold">Bipagem</h3>
              <div className="flex gap-2">
                <input className="p-2 border rounded flex-1" value={scanValue} onChange={e => setScanValue(e.target.value)} placeholder="Digite/Leia o código de barras" />
                <button onClick={onScan} className="px-3 py-2 bg-[#DB1472] text-white rounded">Bipar</button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Modal de Rastreamento Envioecom */}
      {showRastreamento && codigoRastreioAtual && (
        <RastreamentoModal
          codigoRastreio={codigoRastreioAtual}
          onClose={() => {
            setShowRastreamento(false);
            setCodigoRastreioAtual('');
          }}
        />
      )}
    </div>
  );
}
