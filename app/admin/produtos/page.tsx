"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { RefreshCw } from 'lucide-react';

const PAGE_SIZE = 50;
const axiosClient = axios.create({ timeout: 10000 });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Produto = {
  id: number;
  id_externo?: string;
  nome: string;
  estoque: number;
  preco_base: number | null;
  ativo: boolean;
  imagem: string | null;
  imagens?: string[];
};

type Variacao = {
  id?: string | number;
  sku?: string | null;
  codigo_de_barras?: string | null;
  estoque?: number | null;
  preco?: number | null;
  overridden?: boolean;
  [k: string]: unknown;
};

function resolveImageSrc(raw: unknown): string {
  // Returns a safe string src for next/image. Prefer raw strings, then try
  // common object shapes and JSON strings. Fallbacks to placeholder.
  try {
    if (!raw) return '/placeholder-100.png';
      if (typeof raw === 'string') {
      // If it's a JSON string representing an object, try to parse
      const trimmed = raw.trim();
      if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.includes('"')) {
        try {
          const parsed = JSON.parse(trimmed);
          return resolveImageSrc(parsed);
        } catch {
          // not JSON, treat as URL
        }
      }
      return raw;
    }
    if (Array.isArray(raw) && raw.length > 0) {
      return resolveImageSrc(raw[0]);
    }
    if (typeof raw === 'object' && raw !== null) {
      const obj = raw as Record<string, unknown>;
      // common fields
      if (typeof obj['url'] === 'string') return obj['url'] as string;
      if (typeof obj['file'] === 'string') return obj['file'] as string;
      if (typeof obj['path'] === 'string') return obj['path'] as string;
      if (typeof obj['src'] === 'string') return obj['src'] as string;
      // if imagens array exists
      if (Array.isArray(obj['imagens']) && obj['imagens'].length > 0) return String(obj['imagens'][0]);
    }
  } catch (e) {
    console.error('resolveImageSrc error', e);
  }
  return '/placeholder-100.png';
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'loading'; text: string } | null>(null);
  const [toggling, setToggling] = useState<Record<number, boolean>>({});

  async function fetchPage(page: number) {
    setLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from('produtos')
        .select('id,id_externo,nome,estoque,preco_base,ativo,imagem,imagens', { count: 'exact' })
        .range(from, to)
        .order('nome', { ascending: true });

      if (error) {
        console.error('[produtos] supabase error', error);
        setStatusMsg({ type: 'error', text: 'Erro ao carregar produtos.' });
      } else {
        setProdutos((data as Produto[]) || []);
        setTotal(count ?? 0);
      }
    } catch (err: unknown) {
      console.error('[produtos] fetchPage catch', err);
      setStatusMsg({ type: 'error', text: 'Erro ao carregar produtos.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPage(pagina);
  }, [pagina]);

  async function handleSync() {
    setStatusMsg({ type: 'loading', text: 'Sincronizando produtos...' });
    try {
      // request sync for current page only to avoid heavy operations
      const resp = await axiosClient.post('/api/sync-produtos', { page: pagina, length: PAGE_SIZE });
      setStatusMsg({ type: 'success', text: resp.data?.message ?? 'Sincronização concluída.' });
      setPagina(1);
      await fetchPage(1);
    } catch (err: unknown) {
      console.error('[sync] error', err);
      const msg = err instanceof Error ? err.message : 'Erro ao sincronizar.';
      setStatusMsg({ type: 'error', text: msg });
    }
  }

  async function toggleAtivo(produto: Produto) {
    setToggling((s) => ({ ...s, [produto.id]: true }));
    try {
      const resp = await axiosClient.patch(`/api/produtos/${produto.id}`, { ativo: !produto.ativo }, { headers: { 'Content-Type': 'application/json' } });
      if (resp.status >= 200 && resp.status < 300) {
        setProdutos((prev) => prev.map(p => p.id === produto.id ? { ...p, ativo: !p.ativo } : p));
        setStatusMsg({ type: 'success', text: 'Status atualizado.' });
      } else {
        setStatusMsg({ type: 'error', text: resp.data?.error ?? 'Falha ao atualizar.' });
      }
    } catch (err: unknown) {
      console.error('[toggleAtivo] error', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar.';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setToggling((s) => ({ ...s, [produto.id]: false }));
    }
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduto, setModalProduto] = useState<Produto | null>(null);
  const [modalVariacoes, setModalVariacoes] = useState<Variacao[] | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  // expandedVariations holds per-product state: { loading, variacoes, saving }
  const [expandedVariations, setExpandedVariations] = useState<Record<number, { loading: boolean; variacoes: Variacao[] | null; saving?: boolean }>>({});

  async function openProdutoModal(produto: Produto) {
    setModalProduto(produto);
    setModalVariacoes(null);
    setModalOpen(true);
    setModalLoading(true);
    try {
      const resp = await axiosClient.get(`/api/produtos/${produto.id}`);
  const facil = resp.data?.facilzap;
  const dbRow = resp.data?.produto ?? null;
  const meta: unknown[] = Array.isArray(dbRow?.variacoes_meta) ? dbRow.variacoes_meta : [];

  // try to extract and merge variations from facilzap response and apply overrides from meta
  const rawVars: unknown[] = Array.isArray(facil?.variacoes) ? facil.variacoes : [];
      const vars: Variacao[] = rawVars.map((v: unknown) => {
        const rec = (v && typeof v === 'object') ? v as Record<string, unknown> : {};
        const estoqueVal = rec['estoque'];
        const estoque = typeof estoqueVal === 'number'
          ? estoqueVal
          : (estoqueVal && typeof estoqueVal === 'object' ? (Number((estoqueVal as Record<string, unknown>)['estoque'] ?? (estoqueVal as Record<string, unknown>)['disponivel']) || null) : null);
        const precoRaw = rec['preco'];
        const preco = typeof precoRaw === 'number' ? precoRaw : (typeof precoRaw === 'string' ? Number(precoRaw) : null);
        const maybeBarcode = (r: Record<string, unknown>) => {
          // try common barcode/ean fields and variants, including possible internal keys used by FácilZap
          const candidates = [
            'codigo_de_barras', 'codigoBarras', 'codigo', 'codigo_barras', 'codigobarras',
            'barcode', 'ean', 'gtin', 'code',
            // internal/generated keys (facilzap naming variants)
            'codigo_interno', 'codigoInterno', 'codigo_interno_facilzap', 'codigo_gerado', 'codigo_gerado_facilzap', 'internal_code', 'internalBarcode'
          ];
          for (const k of candidates) {
            const v = r[k];
            if (typeof v === 'string' && v.trim() !== '') return v.trim();
            if (typeof v === 'number') return String(v);
          }
          return null;
        };

        const displayName = ((): string => {
          // prefer explicit variation name fields if available
          const names = ['nome', 'nome_variacao', 'descricao', 'descricao_variacao', 'descricaoVar', 'sku', 'id', 'codigo'];
          for (const k of names) {
            const v = rec[k];
            if (typeof v === 'string' && v.trim() !== '') return v.trim();
            if (typeof v === 'number') return String(v);
          }
          return '';
        })();

        const resolvedId = ((): string | number | null => {
          const v = rec['id'] ?? rec['codigo'];
          if (typeof v === 'string' || typeof v === 'number') return v;
          return null;
        })();
        const resolvedSku = ((): string | number | null => {
          const v = rec['sku'] ?? rec['id'];
          if (typeof v === 'string' || typeof v === 'number') return v;
          return null;
        })();

        const base: Variacao = {
          id: resolvedId,
          sku: resolvedSku,
          codigo_de_barras: maybeBarcode(rec) ?? null,
          estoque: typeof estoque === 'number' && Number.isFinite(estoque) ? estoque : null,
          preco: typeof preco === 'number' && Number.isFinite(preco) ? preco : null,
          displayName,
          ...rec,
        } as Variacao;
        // find override in meta by id or sku or barcode
        const override = meta.find((m) => {
          if (!m || typeof m !== 'object') return false;
          const mm = m as Record<string, unknown>;
          if (mm['id'] && base.id && String(mm['id']) === String(base.id)) return true;
          if (mm['sku'] && base.sku && String(mm['sku']) === String(base.sku)) return true;
          // allow override match by any barcode-like field too
          if (mm['codigo_de_barras'] && base.codigo_de_barras && String(mm['codigo_de_barras']) === String(base.codigo_de_barras)) return true;
          if (mm['codigo'] && base.codigo_de_barras && String(mm['codigo']) === String(base.codigo_de_barras)) return true;
          return false;
        }) as Record<string, unknown> | undefined;
        if (override) {
          if (typeof override['estoque'] === 'number') base.estoque = override['estoque'] as number;
          if (typeof override['codigo_de_barras'] === 'string') base.codigo_de_barras = override['codigo_de_barras'] as string;
          // fallback override barcode keys
          if (!base.codigo_de_barras) {
            const mm = override as Record<string, unknown>;
            base.codigo_de_barras = (typeof mm['codigo'] === 'string' ? mm['codigo'] : (typeof mm['barcode'] === 'string' ? mm['barcode'] : base.codigo_de_barras)) as string | null;
          }
          base.overridden = true;
        }
        return base;
      });

      // sort by SKU or id for UX stability
      vars.sort((a, b) => {
        const sa = String(a.sku ?? a.id ?? '')
        const sb = String(b.sku ?? b.id ?? '')
        return sa.localeCompare(sb, undefined, { numeric: true });
      });

      setModalVariacoes(vars);
    } catch (err: unknown) {
      console.error('[modal] fetch detail error', err);
      setModalVariacoes([]);
    } finally {
      setModalLoading(false);
    }
  }

  async function toggleExpandVariacoes(produto: Produto) {
    const existing = expandedVariations[produto.id];
    if (existing && existing.variacoes) {
      // collapse
      setExpandedVariations(prev => ({ ...prev, [produto.id]: { loading: false, variacoes: null } }));
      return;
    }
    // fetch variations
    setExpandedVariations(prev => ({ ...prev, [produto.id]: { loading: true, variacoes: null } }));
    try {
      const resp = await axiosClient.get(`/api/produtos/${produto.id}`);
      const facil = resp.data?.facilzap;
      const dbRow = resp.data?.produto ?? null;
      const meta: unknown[] = Array.isArray(dbRow?.variacoes_meta) ? dbRow.variacoes_meta : [];
      const rawVars: unknown[] = Array.isArray(facil?.variacoes) ? facil.variacoes : [];
      const vars: Variacao[] = rawVars.map((v: unknown) => {
        const rec = (v && typeof v === 'object') ? v as Record<string, unknown> : {};
        const estoqueVal = rec['estoque'];
        const estoque = typeof estoqueVal === 'number'
          ? estoqueVal
          : (estoqueVal && typeof estoqueVal === 'object' ? (Number((estoqueVal as Record<string, unknown>)['estoque'] ?? (estoqueVal as Record<string, unknown>)['disponivel']) || null) : null);
        const precoRaw = rec['preco'];
        const preco = typeof precoRaw === 'number' ? precoRaw : (typeof precoRaw === 'string' ? Number(precoRaw) : null);
        const base: Variacao = {
          id: rec['id'] ?? rec['codigo'] ?? null,
          sku: rec['sku'] ?? rec['id'] ?? null,
          codigo_de_barras: (rec['codigo_de_barras'] ?? rec['codigoBarras'] ?? rec['barcode']) as string | null ?? null,
          estoque: typeof estoque === 'number' && Number.isFinite(estoque) ? estoque : null,
          preco: typeof preco === 'number' && Number.isFinite(preco) ? preco : null,
          ...rec,
        } as Variacao;
        const override = meta.find((m) => {
          if (!m || typeof m !== 'object') return false;
          const mm = m as Record<string, unknown>;
          if (mm['id'] && base.id && String(mm['id']) === String(base.id)) return true;
          if (mm['sku'] && base.sku && String(mm['sku']) === String(base.sku)) return true;
          if (mm['codigo_de_barras'] && base.codigo_de_barras && String(mm['codigo_de_barras']) === String(base.codigo_de_barras)) return true;
          return false;
        }) as Record<string, unknown> | undefined;
        if (override) {
          if (typeof override['estoque'] === 'number') base.estoque = override['estoque'] as number;
          if (typeof override['codigo_de_barras'] === 'string') base.codigo_de_barras = override['codigo_de_barras'] as string;
          base.overridden = true;
        }
        return base;
      });
      vars.sort((a, b) => String(a.sku ?? a.id ?? '').localeCompare(String(b.sku ?? b.id ?? ''), undefined, { numeric: true }));
      setExpandedVariations(prev => ({ ...prev, [produto.id]: { loading: false, variacoes: vars } }));
    } catch (err) {
      console.error('[expand] error', err);
      setExpandedVariations(prev => ({ ...prev, [produto.id]: { loading: false, variacoes: [] } }));
    }
  }

  async function saveBarcodesForProduct(produto: Produto) {
    const state = expandedVariations[produto.id];
    if (!state || !state.variacoes) return;
    setExpandedVariations(prev => ({ ...prev, [produto.id]: { ...prev[produto.id], saving: true } }));
    try {
      const variacoes_meta = state.variacoes.map(v => ({ id: v.id ?? null, estoque: typeof v.estoque === 'number' ? v.estoque : null, codigo_de_barras: v.codigo_de_barras ?? null }));
      const payload: Record<string, unknown> = { variacoes_meta };
      const resp = await axiosClient.patch(`/api/produtos/${produto.id}`, payload, { headers: { 'Content-Type': 'application/json', 'x-admin-token': process.env.NEXT_PUBLIC_SYNC_PRODUCTS_TOKEN ?? '' } });
      if (resp.status >= 200 && resp.status < 300) {
        setStatusMsg({ type: 'success', text: 'Códigos de barras salvos.' });
        setExpandedVariations(prev => ({ ...prev, [produto.id]: { ...prev[produto.id], saving: false } }));
      } else {
        setStatusMsg({ type: 'error', text: resp.data?.error ?? 'Falha ao salvar.' });
        setExpandedVariations(prev => ({ ...prev, [produto.id]: { ...prev[produto.id], saving: false } }));
      }
    } catch (err: unknown) {
      console.error('[saveBarcodes] error', err);
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao salvar.' });
      setExpandedVariations(prev => ({ ...prev, [produto.id]: { ...prev[produto.id], saving: false } }));
    }
  }

  const [saving, setSaving] = useState(false);

  async function saveVariacoes() {
    if (!modalProduto) return;
    if (!modalVariacoes) return;
    setSaving(true);
    try {
      // build variacoes_meta payload: keep id, estoque, codigo_de_barras
      const variacoes_meta = modalVariacoes.map(v => ({ id: v.id ?? null, estoque: v.estoque ?? null, codigo_de_barras: v.codigo_de_barras ?? null }));
      // compute aggregated estoque
      const totalEstoque = modalVariacoes.reduce((acc, v) => acc + (typeof v.estoque === 'number' ? v.estoque : 0), 0);

      const payload: Record<string, unknown> = { variacoes_meta };
      // also update produto.estoque and ativo based on total
      payload.estoque = totalEstoque;
      payload.ativo = totalEstoque > 0;

      const resp = await axiosClient.patch(`/api/produtos/${modalProduto.id}`, payload, { headers: { 'Content-Type': 'application/json', 'x-admin-token': process.env.NEXT_PUBLIC_SYNC_PRODUCTS_TOKEN ?? '' } });
      if (resp.status >= 200 && resp.status < 300) {
        setStatusMsg({ type: 'success', text: 'Variações salvas.' });
        // update local list
        setProdutos(prev => prev.map(p => p.id === modalProduto.id ? { ...p, estoque: totalEstoque, ativo: totalEstoque > 0 } : p));
        closeModal();
      } else {
        setStatusMsg({ type: 'error', text: resp.data?.error ?? 'Falha ao salvar.' });
      }
    } catch (err: unknown) {
      console.error('[saveVariacoes] error', err);
      const msg = err instanceof Error ? err.message : 'Erro ao salvar variações.';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setModalProduto(null);
    setModalVariacoes(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
    <div className="p-8 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Catálogo de Produtos</h1>
          <p className="text-gray-500 mt-1">Gerencie e sincronize os produtos da sua loja.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSync} disabled={statusMsg?.type === 'loading'} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-pink-600 rounded-lg shadow-md hover:bg-pink-700 disabled:bg-pink-300">
            <RefreshCw className={`h-5 w-5 ${statusMsg?.type === 'loading' ? 'animate-spin' : ''}`} />
            {statusMsg?.type === 'loading' ? 'Sincronizando...' : 'Sincronizar Produtos'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 mb-6 rounded ${statusMsg.type === 'success' ? 'bg-green-500 text-white' : statusMsg.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-gray-600">
                <th className="p-4 font-semibold">Imagem</th>
                <th className="p-4 font-semibold">Nome</th>
                <th className="p-4 font-semibold">Estoque</th>
                <th className="p-4 font-semibold">Preço</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Carregando...</td></tr>
              ) : produtos.length > 0 ? (
                produtos.map((p) => (
                  <React.Fragment key={p.id}>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex gap-2">
                        {(p.imagens && p.imagens.length > 0 ? p.imagens.slice(0,3) : [p.imagem ?? '/placeholder-100.png']).map((src, idx) => (
                          <a key={idx} href={resolveImageSrc(src)} target="_blank" rel="noreferrer" className="block rounded overflow-hidden bg-gray-100">
                            <Image src={resolveImageSrc(src)} alt={`${p.nome} ${idx+1}`} width={48} height={48} className="object-cover" />
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-800">{p.nome}</td>
                    <td className="p-4 text-gray-600">{p.estoque}</td>
                    <td className="p-4 text-gray-600">{p.preco_base !== null ? `R$ ${p.preco_base.toFixed(2)}` : 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${p.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleExpandVariacoes(p)} className="px-3 py-1 text-sm rounded bg-white border hover:bg-gray-50">Variações</button>
                        <button onClick={() => openProdutoModal(p)} className="px-3 py-1 text-sm rounded bg-white border hover:bg-gray-50">Detalhes</button>
                        <button onClick={() => toggleAtivo(p)} disabled={!!toggling[p.id]} className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">
                          {toggling[p.id] ? '...' : p.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedVariations[p.id] && expandedVariations[p.id].variacoes && (
                    <tr key={`vars-${p.id}`} className="bg-gray-50">
                      <td colSpan={6} className="p-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-white border-b"><tr>
                              <th className="p-2">Variação</th>
                              <th className="p-2">Estoque</th>
                              <th className="p-2">Preço</th>
                              <th className="p-2">Código de Barras</th>
                            </tr></thead>
                            <tbody>
                              {expandedVariations[p.id].variacoes!.map((v, vi) => (
                                <tr key={String(v.id ?? vi)} className="border-b">
                                  <td className="p-2 align-top">{v.displayName && String(v.displayName).trim() !== '' ? String(v.displayName) : (v.sku ?? v.id ?? `Var ${vi+1}`)}</td>
                                  <td className="p-2">{typeof v.estoque === 'number' ? v.estoque : '—'}</td>
                                  <td className="p-2">{typeof v.preco === 'number' ? `R$ ${v.preco.toFixed(2)}` : (v.preco ?? '—')}</td>
                                  <td className="p-2">
                                    <input type="text" className="w-64 border rounded px-2 py-1" value={v.codigo_de_barras ?? ''} onChange={(e) => {
                                      const val = e.target.value || null;
                                      setExpandedVariations(prev => prev ? ({ ...prev, [p.id]: { ...prev[p.id], variacoes: prev[p.id]!.variacoes!.map((pv, pvi) => pvi === vi ? { ...pv, codigo_de_barras: val } : pv) } }) : prev);
                                    }} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setExpandedVariations(prev => ({ ...prev, [p.id]: { loading: false, variacoes: null } }))} className="px-3 py-1 rounded bg-white border">Fechar</button>
                            <button onClick={() => saveBarcodesForProduct(p)} disabled={!!expandedVariations[p.id].saving} className="px-3 py-1 rounded bg-pink-600 text-white">{expandedVariations[p.id].saving ? 'Salvando...' : 'Salvar'}</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))
              ) : (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhum produto encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
          <span className="text-sm text-gray-600">Página {pagina} de {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1} className="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-50">Anterior</button>
            <button onClick={() => setPagina((p) => Math.min(totalPages, p + 1))} disabled={pagina >= totalPages} className="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-50">Próxima</button>
          </div>
        </div>
      </div>
    </div>
    {/* Modal */}
    {modalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Detalhes: {modalProduto?.nome}</h2>
            <div className="flex items-center gap-3">
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">Fechar</button>
            </div>
          </div>
          {modalLoading ? (
            <div className="text-center py-10">Carregando variações...</div>
          ) : modalVariacoes && modalVariacoes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b"><tr>
                  <th className="p-2">Variante</th>
                  <th className="p-2">Estoque</th>
                  <th className="p-2">Preço</th>
                  <th className="p-2">Código de Barras</th>
                </tr></thead>
                <tbody>
                  {modalVariacoes.map((v, idx) => (
                    <tr key={String(v.id ?? idx)} className="border-b">
                      <td className="p-2 align-top">{v.displayName && String(v.displayName).trim() !== '' ? String(v.displayName) : (v.sku ?? v.id ?? `Var ${idx+1}`)}</td>
                      <td className="p-2">
                        <input type="number" className="w-24 border rounded px-2 py-1" value={v.estoque ?? ''} onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          setModalVariacoes(prev => prev ? prev.map((pv, pi) => pi === idx ? { ...pv, estoque: val } : pv) : prev);
                        }} />
                      </td>
                      <td className="p-2">{typeof v.preco === 'number' ? `R$ ${v.preco.toFixed ? v.preco.toFixed(2) : Number(v.preco).toFixed(2)}` : (v.preco ?? '—')}</td>
                      <td className="p-2">
                          <div className="flex items-center gap-2">
                          <input type="text" className="w-44 border rounded px-2 py-1" value={v.codigo_de_barras ?? ''} onChange={(e) => {
                            const val = e.target.value || null;
                            setModalVariacoes(prev => prev ? prev.map((pv, pi) => pi === idx ? { ...pv, codigo_de_barras: val } : pv) : prev);
                          }} />
                          { Boolean(v.overridden) && <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Override</span> }
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={closeModal} className="px-4 py-2 rounded bg-white border">Cancelar</button>
                <button onClick={saveVariacoes} disabled={saving} className="px-4 py-2 rounded bg-pink-600 text-white">{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-600">Nenhuma variação encontrada para este produto.</div>
          )}
        </div>
      </div>
    )}
    </>
  );
}