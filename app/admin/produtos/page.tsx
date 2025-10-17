"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { RefreshCw } from 'lucide-react';
// Debug UI removed per request

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
  variacoes_meta?: unknown[];
  codigo_barras?: string | null;
  estoque_display?: number;
  categorias?: { id?: number; nome: string }[] | null;
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
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'loading' | 'info'; text: string } | null>(null);
  const [toggling, setToggling] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'none' | 'price_desc' | 'price_asc' | 'date_new' | 'date_old'>('none');
  const [categories, setCategories] = useState<{ id?: number; nome: string }[]>([]);
  const [categoriesPanelOpen, setCategoriesPanelOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoriaNome, setCategoriaNome] = useState('');
  const [editingCategoriaId, setEditingCategoriaId] = useState<number | null>(null);
  const [editingCategoriaNome, setEditingCategoriaNome] = useState('');
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});
  // categoriesPanelOpen and categoriaNome are declared above; duplicates removed after merge

  async function fetchPage(page: number) {
    setLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      // Build a defensive query: only order by known safe columns to avoid Bad Request
      const allowedOrderCols = ['id', 'nome', 'preco_base', 'created_at'];
      const q = supabase.from('produtos').select('id,id_externo,nome,estoque,preco_base,ativo,imagem,imagens,variacoes_meta,codigo_barras,created_at', { count: 'exact' }).range(from, to);
      let finalQ = q;
      if (allowedOrderCols.includes('nome')) {
        finalQ = finalQ.order('nome', { ascending: true });
      }
      const { data, error, count } = await finalQ;

      if (error) {
        // Improve logging so we can see Supabase error details in the browser console
        const asRecord = (e: unknown): Record<string, unknown> => (typeof e === 'object' && e !== null) ? e as Record<string, unknown> : { message: String(e) };
        const info = asRecord(error);
        try {
            // Stringify to ensure the full object is visible in minified production consoles
            console.error('[produtos] supabase error', JSON.stringify(info, null, 2));
          } catch {
            console.error('[produtos] supabase raw error', error);
          }

        // If Supabase returned a Bad Request (400), attempt a safer fallback query to help debug
        const statusVal = (info['status'] ?? info['code']) as unknown;
        if (statusVal === 400 || statusVal === '400') {
          try {
            const fb = await supabase
              .from('produtos')
              .select('id,nome,estoque,preco_base,ativo,imagem,imagens', { count: 'exact' })
              .range(from, to)
              .order('id', { ascending: true });
            if (!fb.error && fb.data) {
              const fallbackMapped = ((fb.data as Produto[]) || []).map(p => ({ ...p, estoque_display: Number(p.estoque ?? 0) } as Produto));
              setProdutos(fallbackMapped);
              setTotal(fb.count ?? 0);
              setStatusMsg({ type: 'info', text: 'Consulta alternativa executada (fallback).' });
              setLoading(false);
              return;
            }
          } catch (fbErr) {
            console.error('[produtos] supabase fallback error', fbErr);
          }
        }

        setStatusMsg({ type: 'error', text: 'Erro ao carregar produtos.' });
      } else {
        // compute a display estoque using variacoes_meta when present to keep list consistent with modal
        const mapped = ((data as Produto[]) || []).map(p => {
          try {
            const vm = Array.isArray((p as unknown as Record<string, unknown>).variacoes_meta) ? (p as unknown as Record<string, unknown>).variacoes_meta as unknown[] : [];
            if (vm.length > 0) {
              const total = vm.reduce((acc: number, it: unknown) => {
                const e = it && typeof it === 'object' ? ((it as Record<string, unknown>).estoque ?? (it as Record<string, unknown>)['estoque']) : null;
                if (typeof e === 'number') return acc + e;
                if (typeof e === 'string') { const n = Number(String(e).replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? acc + n : acc; }
                return acc;
              }, 0);
              return { ...p, estoque_display: Number(total) } as Produto;
            }
          } catch {}
          return { ...p, estoque_display: Number(p.estoque ?? 0) } as Produto;
        });
        setProdutos(mapped);
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

  useEffect(() => {
    // fetch categories once
    (async () => {
      try {
        // prefer server-side admin route (falls back to direct supabase if env not configured)
        try {
          const resp = await axiosClient.get('/api/admin/categorias/list');
          if (resp.status >= 200 && resp.status < 300) {
            setCategories((resp.data?.items ?? []) as { id?: number; nome: string }[]);
            return;
          }
        } catch {
          // fallback to direct supabase client
        }
        const { data, error } = await supabase.from('categorias').select('id,nome').order('nome', { ascending: true }).limit(500);
        if (!error && data) setCategories(data as { id?: number; nome: string }[]);
      } catch (err) {
        console.error('[produtos] fetch categorias error', err);
      }
    })();
  }, []);

  async function refreshCategorias() {
    try {
      const resp = await axiosClient.get('/api/admin/categorias/list');
      if (resp.status >= 200 && resp.status < 300) {
        setCategories(resp.data?.items ?? []);
      }
    } catch (err) {
      console.error('refreshCategorias', err);
    }
  }

  async function handleCreateCategoria() {
    const nome = (categoriaNome || '').trim();
    if (!nome) return alert('Nome da categoria é obrigatório');
    try {
      const resp = await axiosClient.post('/api/admin/categorias/action', { action: 'create', nome });
      if (resp.status >= 200 && resp.status < 300) {
        setCategoriaNome('');
        await refreshCategorias();
        setStatusMsg({ type: 'success', text: 'Categoria criada.' });
      } else {
        setStatusMsg({ type: 'error', text: resp.data?.error ?? 'Erro ao criar categoria.' });
      }
    } catch (err) {
      console.error('create categoria', err);
      setStatusMsg({ type: 'error', text: 'Erro ao criar categoria.' });
    }
  }

  async function handleUpdateCategoria() {
    if (!editingCategoriaId) return;
    const nome = (editingCategoriaNome || '').trim();
    if (!nome) return alert('Nome da categoria é obrigatório');
    try {
      const resp = await axiosClient.post('/api/admin/categorias/action', { action: 'update', id: editingCategoriaId, updates: { nome } });
      if (resp.status >= 200 && resp.status < 300) {
        setEditingCategoriaId(null);
        setEditingCategoriaNome('');
        await refreshCategorias();
        setStatusMsg({ type: 'success', text: 'Categoria atualizada.' });
      } else {
        setStatusMsg({ type: 'error', text: resp.data?.error ?? 'Erro ao atualizar.' });
      }
    } catch (err) {
      console.error('update categoria', err);
      setStatusMsg({ type: 'error', text: 'Erro ao atualizar categoria.' });
    }
  }

  async function handleDeleteCategoria(id?: number) {
    if (!id) return;
    if (!confirm('Deseja excluir esta categoria?')) return;
    try {
      const resp = await axiosClient.post('/api/admin/categorias/action', { action: 'delete', id });
      if (resp.status >= 200 && resp.status < 300) {
        await refreshCategorias();
        setStatusMsg({ type: 'success', text: 'Categoria excluída.' });
        // if selected category was deleted, clear
        if (selectedCategoryId === id) setSelectedCategoryId(null);
      } else {
        setStatusMsg({ type: 'error', text: resp.data?.error ?? 'Erro ao excluir.' });
      }
    } catch (err) {
      console.error('delete categoria', err);
      setStatusMsg({ type: 'error', text: 'Erro ao excluir categoria.' });
    }
  }

  async function applyCategoriaToSelected(categoriaId?: number) {
    const targetCategoryId = categoriaId ?? selectedCategoryId;
    if (!targetCategoryId) return alert('Selecione uma categoria para aplicar.');
    const ids = Object.keys(selectedIds).map(k => Number(k));
    if (ids.length === 0) return alert('Nenhum produto selecionado.');
    try {
  const resp = await axiosClient.post('/api/admin/produtos/categorias/action', { action: 'attach', categoria_id: targetCategoryId, produto_ids: ids });
      if (resp.status >= 200 && resp.status < 300) {
        setStatusMsg({ type: 'success', text: 'Categoria aplicada aos produtos selecionados.' });
        // optimistic update: add categoria name to visibleProdutos and produtos
      const cat = categories.find(c => c.id === targetCategoryId);
        if (cat) {
        setProdutos(prev => prev.map(p => ids.includes(p.id) ? ({ ...p, categorias: Array.isArray(p.categorias) ? (p.categorias!.concat([{ id: targetCategoryId, nome: cat.nome }])) : [{ id: targetCategoryId, nome: cat.nome }] }) : p));
        setVisibleProdutos(prev => prev.map(p => ids.includes(p.id) ? ({ ...p, categorias: Array.isArray(p.categorias) ? (p.categorias!.concat([{ id: targetCategoryId, nome: cat.nome }])) : [{ id: targetCategoryId, nome: cat.nome }] }) : p));
        }
        setSelectedIds({});
      } else {
        setStatusMsg({ type: 'error', text: resp.data?.error ?? 'Erro ao aplicar categoria.' });
      }
    } catch (err) {
      console.error('apply categoria', err);
      setStatusMsg({ type: 'error', text: 'Erro ao aplicar categoria.' });
    }
  }

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

  // per-product category selection state
  const [productCategorySelection, setProductCategorySelection] = useState<Record<number, number | null>>({});

  async function attachCategoriaToProduct(produtoId: number, categoriaId?: number | null) {
    const target = categoriaId ?? productCategorySelection[produtoId];
    if (!target) return alert('Selecione uma categoria para aplicar.');
    try {
      const resp = await axiosClient.post('/api/admin/produtos/categorias/action', { action: 'attach', categoria_id: target, produto_ids: [produtoId] });
      if (resp.status >= 200 && resp.status < 300) {
        const cat = categories.find(c => c.id === target);
        if (cat) {
          setProdutos(prev => prev.map(p => p.id === produtoId ? ({ ...p, categorias: Array.isArray(p.categorias) ? (p.categorias!.some(x => Number(x.id) === Number(target)) ? p.categorias : p.categorias!.concat([{ id: target, nome: cat.nome }]) ) : [{ id: target, nome: cat.nome }] }) : p));
          setVisibleProdutos(prev => prev.map(p => p.id === produtoId ? ({ ...p, categorias: Array.isArray(p.categorias) ? (p.categorias!.some(x => Number(x.id) === Number(target)) ? p.categorias : p.categorias!.concat([{ id: target, nome: cat.nome }]) ) : [{ id: target, nome: cat.nome }] }) : p));
        }
        setStatusMsg({ type: 'success', text: 'Categoria aplicada ao produto.' });
        setProductCategorySelection(prev => ({ ...prev, [produtoId]: null }));
      } else {
        setStatusMsg({ type: 'error', text: resp.data?.error ?? 'Erro ao aplicar categoria.' });
      }
    } catch (err) {
      console.error('attach categoria product', err);
      setStatusMsg({ type: 'error', text: 'Erro ao aplicar categoria.' });
    }
  }

  async function detachCategoriaFromProduct(produtoId: number, categoriaId?: number | null) {
    if (!categoriaId) return;
    try {
      const resp = await axiosClient.post('/api/admin/produtos/categorias/action', { action: 'detach', categoria_id: categoriaId, produto_ids: [produtoId] });
      if (resp.status >= 200 && resp.status < 300) {
        setProdutos(prev => prev.map(p => p.id === produtoId ? ({ ...p, categorias: Array.isArray(p.categorias) ? p.categorias!.filter(c => Number(c.id) !== Number(categoriaId)) : [] }) : p));
        setVisibleProdutos(prev => prev.map(p => p.id === produtoId ? ({ ...p, categorias: Array.isArray(p.categorias) ? p.categorias!.filter(c => Number(c.id) !== Number(categoriaId)) : [] }) : p));
        setStatusMsg({ type: 'success', text: 'Categoria removida do produto.' });
      } else {
        setStatusMsg({ type: 'error', text: resp.data?.error ?? 'Erro ao remover categoria.' });
      }
    } catch (err) {
      console.error('detach categoria product', err);
      setStatusMsg({ type: 'error', text: 'Erro ao remover categoria.' });
    }
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduto, setModalProduto] = useState<Produto | null>(null);
  const [modalVariacoes, setModalVariacoes] = useState<Variacao[] | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  // debug UI removed
  // modalVariacoes holds variations for the selected product
  // modalFacilzap was used during debugging; remove to satisfy linter

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
      // helper: try common keys / substrings to find a value (may return number|string|object)
      const findValueByKeys = (r: Record<string, unknown>, candidates: string[]) => {
        for (const k of candidates) {
          const val = r[k];
          if (typeof val === 'number' || typeof val === 'string' || (typeof val === 'object' && val !== null)) return val;
        }
        // fallback: try substring matches
        for (const key of Object.keys(r)) {
          const lk = key.toLowerCase();
          for (const cand of candidates) {
            if (lk.includes(cand.toLowerCase())) {
              const val = r[key];
              if (typeof val === 'number' || typeof val === 'string' || (typeof val === 'object' && val !== null)) return val;
            }
          }
        }
        return undefined;
      };

      const normalizeNumberLike = (val: unknown, nestedCandidates: string[] = ['estoque', 'disponivel', 'preco', 'price', 'valor']) : number | null => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const n = Number(val);
          return Number.isFinite(n) ? n : null;
        }
        if (val && typeof val === 'object') {
          const obj = val as Record<string, unknown>;
          for (const k of nestedCandidates) {
            const v = obj[k];
            if (typeof v === 'number') return v;
            if (typeof v === 'string') {
              const n = Number(v);
              if (Number.isFinite(n)) return n;
            }
          }
          // also try any numeric-like descendant
          for (const key of Object.keys(obj)) {
            const v = obj[key];
            if (typeof v === 'number') return v;
            if (typeof v === 'string') {
              const n = Number(v);
              if (Number.isFinite(n)) return n;
            }
          }
        }
        return null;
      };

      const vars: Variacao[] = rawVars.map((v: unknown) => {
        const rec = (v && typeof v === 'object') ? v as Record<string, unknown> : {};
        // estoque: try explicit keys then substrings; normalize nested objects
        const estoqueVal = findValueByKeys(rec, ['estoque', 'disponivel', 'quantity', 'quantidade', 'qtd', 'stock', 'available']);
        const estoque = normalizeNumberLike(estoqueVal, ['estoque', 'disponivel', 'quantity', 'qtd', 'available']);
        // preco: try several naming variants and normalize
        const precoRaw = findValueByKeys(rec, ['preco', 'price', 'valor', 'valor_unitario', 'preco_unitario']);
        const preco = normalizeNumberLike(precoRaw, ['preco', 'price', 'valor']);
        const maybeBarcode = (r: Record<string, unknown>) => {
          // try common barcode/ean fields and variants, including possible internal keys used by FácilZap
          const candidates = [
            'codigo_de_barras', 'codigoBarras', 'codigo', 'codigo_barras', 'codigobarras',
            'barcode', 'ean', 'gtin', 'code',
            // internal/generated keys (facilzap naming variants)
            'codigo_interno', 'codigoInterno', 'codigo_interno_facilzap', 'codigo_gerado', 'codigo_gerado_facilzap', 'internal_code', 'internalBarcode'
          ];
          // also check for arrays named like cod_barras which some endpoints return
          const arrCandidates = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras'];
          for (const ak of arrCandidates) {
            const av = r[ak];
            if (Array.isArray(av) && av.length > 0) {
              // pick first non-null string/number
              for (const it of av) {
                if (typeof it === 'string' && it.trim() !== '') return it.trim();
                if (typeof it === 'number') return String(it);
                // sometimes items are objects like {numero: '...'}
                if (it && typeof it === 'object') {
                  const itRec = it as Record<string, unknown>;
                  const cand = (typeof itRec['numero'] === 'string' && itRec['numero'].trim() !== '') ? itRec['numero'] : (typeof itRec['number'] === 'string' && itRec['number'].trim() !== '' ? itRec['number'] : null);
                  if (cand) return String(cand).trim();
                }
              }
            }
            // sometimes cod_barras is provided as an object like { tipo:'ean13', numero: '...' }
            if (av && typeof av === 'object' && !Array.isArray(av)) {
              const obj = av as Record<string, unknown>;
              if (typeof obj['numero'] === 'string' && obj['numero'].trim() !== '') return obj['numero'].trim();
              if (typeof obj['number'] === 'string' && obj['number'].trim() !== '') return obj['number'].trim();
            }
          }
          for (const k of candidates) {
            const v = r[k];
            if (typeof v === 'string' && v.trim() !== '') return v.trim();
            if (typeof v === 'number') return String(v);
          }
          // fallback: scan keys for substrings like 'cod' or 'ean' or 'bar'
          for (const key of Object.keys(r)) {
            const lk = key.toLowerCase();
            if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
              const v = r[key];
              if (typeof v === 'string' && v.trim() !== '') return v.trim();
              if (typeof v === 'number') return String(v);
              // handle nested object like { tipo:'ean13', numero: '...' }
              if (v && typeof v === 'object') {
                const vr = v as Record<string, unknown>;
                if (typeof vr['numero'] === 'string' && vr['numero'].trim() !== '') return vr['numero'].trim();
                if (typeof vr['number'] === 'string' && vr['number'].trim() !== '') return vr['number'].trim();
              }
            }
          }
          return null;
        };

        const displayName = ((): string => {
          // prefer explicit variation name fields if available
          const names = ['nome', 'nome_variacao', 'descricao_variacao', 'descricaoVar', 'sku', 'id', 'codigo'];
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
          const v = rec['sku'] ?? rec['id'] ?? rec['codigo'] ?? rec['codigo_interno'] ?? rec['reference'];
          if (typeof v === 'string' || typeof v === 'number') return v;
          // try substring-key search for fallback
          const fk = findValueByKeys(rec, ['sku', 'id', 'codigo', 'code', 'reference']);
          if (typeof fk === 'string' || typeof fk === 'number') return fk as string | number;
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

      // debug logs removed

      // If the upstream product provides a top-level array of barcodes (e.g. "cod_barras": [..])
      // map them to variations by index when the variation itself didn't provide a barcode.
      try {
        const asRecord = (x: unknown): Record<string, unknown> | null => (typeof x === 'object' && x !== null) ? x as Record<string, unknown> : null;
        const facilRec = asRecord(facil);
        const dbRec = asRecord(dbRow);
        // product-level cod_barras may be an array or an object like { numero: '...' }
        let productBarcodes: unknown[] | null = null;
        if (Array.isArray(facilRec?.['cod_barras'])) {
          productBarcodes = facilRec!['cod_barras'] as unknown[];
        } else if (facilRec && typeof facilRec['cod_barras'] === 'object' && facilRec['cod_barras'] !== null) {
          const cb = facilRec['cod_barras'] as Record<string, unknown>;
          const num = typeof cb['numero'] === 'string' && cb['numero'].trim() !== '' ? cb['numero'].trim() : (typeof cb['number'] === 'string' && cb['number'].trim() !== '' ? cb['number'].trim() : null);
          productBarcodes = num ? [num] : null;
        } else if (Array.isArray(dbRec?.['cod_barras'])) {
          productBarcodes = dbRec!['cod_barras'] as unknown[];
        } else if (dbRec && typeof dbRec['cod_barras'] === 'object' && dbRec['cod_barras'] !== null) {
          const cb = dbRec['cod_barras'] as Record<string, unknown>;
          const num = typeof cb['numero'] === 'string' && cb['numero'].trim() !== '' ? cb['numero'].trim() : (typeof cb['number'] === 'string' && cb['number'].trim() !== '' ? cb['number'].trim() : null);
          productBarcodes = num ? [num] : null;
        } else {
          productBarcodes = null;
        }
        if (Array.isArray(productBarcodes) && productBarcodes.length > 0) {
          for (let i = 0; i < vars.length; i++) {
            const cand = productBarcodes[i];
            if ((vars[i].codigo_de_barras === null || vars[i].codigo_de_barras === undefined || String(vars[i].codigo_de_barras).trim() === '') && (typeof cand === 'string' && cand.trim() !== '' || typeof cand === 'number')) {
              vars[i].codigo_de_barras = typeof cand === 'number' ? String(cand) : (cand as string).trim();
              vars[i].overridden = vars[i].overridden || false;
            }
          }
        }
      } catch {}
      setModalVariacoes(vars);
    } catch (err: unknown) {
      console.error('[modal] fetch detail error', err);
      setModalVariacoes([]);
    } finally {
      setModalLoading(false);
    }
  }

  // Import and manual save removed; estoque is synchronized automatically by the server-side sync job.

  function closeModal() {
    setModalOpen(false);
    setModalProduto(null);
    setModalVariacoes(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // derive visible products applying search and sort; when searchTerm present use server-side search
  const [visibleProdutos, setVisibleProdutos] = React.useState<Produto[]>([]);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (searchTerm && searchTerm.trim() !== '') {
          // server-side search across all products
          const resp = await axiosClient.get(`/api/produtos/search?query=${encodeURIComponent(searchTerm)}&limit=200`);
          const data = resp.data?.produtos ?? [];
          if (!mounted) return;
          const arr = (data as Produto[]).map(p => ({ ...p, estoque_display: Number(p.estoque ?? 0) }));
          // apply sort locally
          switch (sortBy) {
            case 'price_desc': arr.sort((a,b) => (b.preco_base ?? 0) - (a.preco_base ?? 0)); break;
            case 'price_asc': arr.sort((a,b) => (a.preco_base ?? 0) - (b.preco_base ?? 0)); break;
            case 'date_new': arr.sort((a,b) => (b.id ?? 0) - (a.id ?? 0)); break;
            case 'date_old': arr.sort((a,b) => (a.id ?? 0) - (b.id ?? 0)); break;
            default: break;
          }
          setVisibleProdutos(arr);
        } else {
          // use paginated products loaded in state
          const arr = produtos.slice();
          switch (sortBy) {
            case 'price_desc': arr.sort((a,b) => (b.preco_base ?? 0) - (a.preco_base ?? 0)); break;
            case 'price_asc': arr.sort((a,b) => (a.preco_base ?? 0) - (b.preco_base ?? 0)); break;
            case 'date_new': arr.sort((a,b) => (b.id ?? 0) - (a.id ?? 0)); break;
            case 'date_old': arr.sort((a,b) => (a.id ?? 0) - (b.id ?? 0)); break;
            default: break;
          }
          setVisibleProdutos(arr);
        }
      } catch (e) {
        console.error('[produtos] search error', e);
      }
    })();
    return () => { mounted = false; };
  }, [produtos, searchTerm, sortBy]);

  return (
    <>
    <div className="p-8 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Catálogo de Produtos</h1>
          <p className="text-gray-500 mt-1">Gerencie e sincronize os produtos da sua loja.</p>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={Object.keys(selectedIds).length === 0} onClick={async () => {
            const ids = Object.keys(selectedIds).map(k => Number(k));
            try {
              await axiosClient.patch('/api/produtos/batch', { ids, ativo: true });
              setProdutos(prev => prev.map(p => ids.includes(p.id) ? { ...p, ativo: true } : p));
              setVisibleProdutos(prev => prev.map(p => ids.includes(p.id) ? { ...p, ativo: true } : p));
              setSelectedIds({});
            } catch (e) {
              console.error('bulk activate error', e);
            }
          }} className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50">Ativar selecionados</button>

          <button disabled={Object.keys(selectedIds).length === 0} onClick={async () => {
            const ids = Object.keys(selectedIds).map(k => Number(k));
            try {
              await axiosClient.patch('/api/produtos/batch', { ids, ativo: false });
              setProdutos(prev => prev.map(p => ids.includes(p.id) ? { ...p, ativo: false } : p));
              setVisibleProdutos(prev => prev.map(p => ids.includes(p.id) ? { ...p, ativo: false } : p));
              setSelectedIds({});
            } catch (e) {
              console.error('bulk deactivate error', e);
            }
          }} className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50">Desativar selecionados</button>

          <button onClick={handleSync} disabled={statusMsg?.type === 'loading'} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-pink-600 rounded-lg shadow-md hover:bg-pink-700 disabled:bg-pink-300">
            <RefreshCw className={`h-5 w-5 ${statusMsg?.type === 'loading' ? 'animate-spin' : ''}`} />
            {statusMsg?.type === 'loading' ? 'Sincronizando...' : 'Sincronizar Produtos'}
          </button>
          <button onClick={() => setCategoriesPanelOpen(true)} className="px-3 py-2 bg-indigo-600 text-white rounded">Categorias</button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 mb-6 rounded ${statusMsg.type === 'success' ? 'bg-green-500 text-white' : statusMsg.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-3 sm:p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar produtos..." className="px-3 py-2 border rounded w-full sm:w-64" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Ordenar:</label>
            <select value={sortBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'none' | 'price_desc' | 'price_asc' | 'date_new' | 'date_old')} className="px-2 py-2 border rounded">
              <option value="none">Padrão</option>
              <option value="price_desc">Preço: maior → menor</option>
              <option value="price_asc">Preço: menor → maior</option>
              <option value="date_new">Data: novo → antigo</option>
              <option value="date_old">Data: antigo → novo</option>
            </select>
            <select onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                // reset to original pagination
                setVisibleProdutos(produtos.slice());
                return;
              }
              const targetId = Number(v);
              setVisibleProdutos(prev => prev.filter(p => Array.isArray(p.categorias) && p.categorias.some(c => Number((c && typeof c === 'object' && 'id' in c ? (c as { id?: number }).id ?? null : null)) === targetId)));
            }} className="px-2 py-2 border rounded">
              <option value="">Todas categorias</option>
              {categories.map(c => <option key={c.id ?? c.nome} value={c.id ?? ''}>{c.nome}</option>)}
            </select>
          </div>
        </div>
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
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Carregando...</td></tr>
              ) : produtos.length > 0 ? (

      
                visibleProdutos.map((p) => (
                  <React.Fragment key={p.id}>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <input type="checkbox" checked={!!selectedIds[p.id ?? 0]} onChange={(e) => setSelectedIds(prev => ({ ...prev, [p.id ?? 0]: e.target.checked }))} />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {(p.imagens && p.imagens.length > 0 ? p.imagens.slice(0,3) : [p.imagem ?? '/placeholder-100.png']).map((src, idx) => {
                          const srcStr = resolveImageSrc(src);
                          // Render plain <img> for proxy URLs or direct FácilZap hosts to avoid next/image re-encoding
                          const isProxy = String(srcStr).includes('cjotarasteirinhas.com.br/.netlify/functions/proxy-facilzap-image') || String(srcStr).includes('arquivos.facilzap.app.br');
                          return (
                            <a key={idx} href={srcStr} target="_blank" rel="noreferrer" className="block rounded overflow-hidden bg-gray-100">
                              {isProxy ? (
                                // use plain <img> for proxied URLs to avoid next/image re-encoding query params
                                // keep same layout/size for visual consistency
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={srcStr} alt={`${p.nome} ${idx+1}`} width={48} height={48} className="object-cover"
                                  onError={(e) => {
                                    const el = e.currentTarget as HTMLImageElement;
                                    const original = extractOriginalFromProxy(el.src);
                                    if (original && el.src !== original) {
                                      el.src = original;
                                    }
                                  }}
                                />
                              ) : (
                                <Image src={srcStr} alt={`${p.nome} ${idx+1}`} width={48} height={48} className="object-cover" />
                              )}
                            </a>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-800">{p.nome}</td>
                    <td className="p-4 text-gray-600">{renderDisplayValue(p.estoque_display ?? p.estoque)}</td>
                    <td className="p-4 text-gray-600">{p.preco_base !== null ? `R$ ${p.preco_base.toFixed(2)}` : 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${p.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openProdutoModal(p)} className="px-3 py-2 text-sm rounded bg-white border hover:bg-gray-50 min-h-[44px]">Detalhes</button>
                          <button onClick={() => toggleAtivo(p)} disabled={!!toggling[p.id]} className="px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200 min-h-[44px]">
                            {toggling[p.id] ? '...' : p.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <select value={productCategorySelection[p.id] ?? ''} onChange={(e) => setProductCategorySelection(prev => ({ ...prev, [p.id]: e.target.value ? Number(e.target.value) : null }))} className="px-2 py-1 border rounded">
                            <option value="">Categoria...</option>
                            {categories.map(c => <option key={c.id ?? c.nome} value={c.id ?? ''}>{c.nome}</option>)}
                          </select>
                          <button onClick={() => attachCategoriaToProduct(p.id)} className="px-2 py-1 bg-green-600 text-white rounded" title="Aplicar categoria a este produto">Aplicar</button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(p.categorias) && p.categorias.map((c) => {
                            const cat = c as { id?: number; nome: string };
                            const catId = cat.id ?? null;
                            return (
                              <div key={String(catId ?? cat.nome)} className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded">
                                <span className="text-sm">{cat.nome}</span>
                                {catId ? <button onClick={() => detachCategoriaFromProduct(p.id, catId)} className="text-xs text-red-600">Remover</button> : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  </React.Fragment>
                ))
              ) : (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum produto encontrado.</td></tr>
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
    {/* Categories panel */}
    {categoriesPanelOpen && (
      <div className="fixed inset-0 z-60 flex">
        <div className="flex-1" onClick={() => setCategoriesPanelOpen(false)} />
        <div className="w-full sm:w-96 bg-white p-4 shadow-lg overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Categorias</h3>
            <button onClick={() => setCategoriesPanelOpen(false)} className="text-gray-600">Fechar</button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Criar nova</label>
              <div className="flex gap-2 mt-2">
                <input value={categoriaNome} onChange={(e) => setCategoriaNome(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Nome da categoria" />
                <button onClick={handleCreateCategoria} className="px-3 py-2 bg-[#DB1472] text-white rounded">Criar</button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Aplicar categoria aos selecionados</label>
              <div className="flex gap-2 mt-2">
                <select value={selectedCategoryId ?? ''} onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)} className="flex-1 p-2 border rounded">
                  <option value="">Escolha uma categoria</option>
                  {categories.map(c => <option key={c.id ?? c.nome} value={c.id ?? ''}>{c.nome}</option>)}
                </select>
                <button onClick={() => applyCategoriaToSelected()} className="px-3 py-2 bg-green-600 text-white rounded" disabled={Object.keys(selectedIds).length === 0}>Aplicar</button>
              </div>
            </div>

            <div>
              <h4 className="font-medium">Todas as categorias</h4>
              <div className="mt-2 space-y-2">
                {categories.map(c => (
                  <div key={c.id ?? c.nome} className="flex items-center justify-between p-2 border rounded">
                    <div>{c.nome}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingCategoriaId(c.id ?? null); setEditingCategoriaNome(c.nome); }} className="px-2 py-1 text-sm bg-yellow-300 rounded">Editar</button>
                      <button onClick={() => handleDeleteCategoria(c.id)} className="px-2 py-1 text-sm text-red-600 border rounded">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {editingCategoriaId && (
              <div className="pt-3 border-t">
                <label className="text-sm text-gray-600">Editar categoria</label>
                <div className="flex gap-2 mt-2">
                  <input value={editingCategoriaNome} onChange={(e) => setEditingCategoriaNome(e.target.value)} className="flex-1 p-2 border rounded" />
                  <button onClick={handleUpdateCategoria} className="px-3 py-2 bg-[#DB1472] text-white rounded">Salvar</button>
                  <button onClick={() => { setEditingCategoriaId(null); setEditingCategoriaNome(''); }} className="px-3 py-2 border rounded">Cancelar</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    )}
    {/* Modal */}
    {modalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Detalhes: {modalProduto?.nome}</h2>
            <div className="flex items-center gap-3">
              {/* Import and Debug removed — estoque is synced automatically */}
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">Fechar</button>
            </div>
          </div>
          {/* Debug view removed */}
          {modalLoading ? (
            <div className="text-center py-10">Carregando variações...</div>
          ) : modalVariacoes && modalVariacoes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b"><tr>
                  <th className="p-2">Variante</th>
                  <th className="p-2">SKU</th>
                  <th className="p-2">Estoque</th>
                </tr></thead>
                <tbody>
                  {modalVariacoes.map((v, idx) => (
                    <tr key={String(v.id ?? idx)} className="border-b">
                      <td className="p-2 align-top">{v.displayName && String(v.displayName).trim() !== '' ? String(v.displayName) : `Var ${idx+1}`}</td>
                      <td className="p-2 text-sm text-gray-700">{v.sku ?? v.id ?? '—'}</td>
                      <td className="p-2 text-gray-700">{renderDisplayValue(v.estoque)}</td>
                      {/* Price and barcode columns removed per UI simplification */}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={closeModal} className="px-4 py-2 rounded bg-white border">Fechar</button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-600">Nenhuma variação encontrada para este produto.</div>
          )}
        </div>
      </div>
    )}
      {/* Categories side panel */}
      {categoriesPanelOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-start">
          <div className="ml-auto w-full md:w-2/5 bg-white p-4 md:p-6 overflow-auto h-full">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Categorias</h2>
              <button onClick={() => setCategoriesPanelOpen(false)} className="text-gray-600">Fechar</button>
            </div>

            <section className="mt-4">
              <div className="flex gap-2">
                <input className="flex-1 p-2 border rounded" placeholder="Nova categoria" value={categoriaNome} onChange={e => setCategoriaNome(e.target.value)} />
                <button onClick={handleCreateCategoria} className="px-4 py-2 bg-[#DB1472] text-white rounded">Criar</button>
              </div>

              <div className="mt-4 space-y-2">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 border rounded">
                    <div>{c.nome}</div>
                    <div className="flex gap-2">
                      <button onClick={() => applyCategoriaToSelected(c.id)} className="px-2 py-1 border rounded">Aplicar aos selecionados</button>
                      <button onClick={() => handleDeleteCategoria(c.id)} className="px-2 py-1 text-red-600">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}

// Categories side panel appended to ensure handlers/vars are used (rendered by state)
// Note: this is outside the component return, but will be rendered conditionally via portal if needed.


function extractOriginalFromProxy(src: string): string | null {
  try {
    const u = new URL(src);
    // prefer facilzap param then url
    const facil = u.searchParams.get('facilzap') ?? u.searchParams.get('url');
    if (!facil) return null;
    try {
      return decodeURIComponent(facil);
    } catch {
      return facil;
    }
  } catch (err) {
    // log for diagnostics when unexpected src formats are passed
  // (non-blocking; keeps TypeScript/ESLint happy)
  console.error('extractOriginalFromProxy error:', err);
    return null;
  }
}

function renderDisplayValue(v: unknown): React.ReactNode {
  try {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') {
      // if it's a known shape, try to show a primary field
      const obj = v as Record<string, unknown>;
      if (typeof obj['estoque'] === 'number') return obj['estoque'];
      if (typeof obj['estoque'] === 'string') return obj['estoque'];
      if (typeof obj['quantidade'] === 'number') return obj['quantidade'];
      // fallback to a compact JSON representation
      return JSON.stringify(obj);
    }
  } catch {
    // ignore and fallthrough
  }
  return '—';
}