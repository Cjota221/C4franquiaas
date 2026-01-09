"use client";
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { Package, Loader2, Search, Eye, EyeOff, Percent, Link2, Check, CheckCircle, AlertCircle, TrendingUp, Sparkles, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import VideoTutorialButton from '@/components/VideoTutorialButton';

interface ProdutoComMargem {
  id: string;
  produto_franqueada_id: string;
  nome: string;
  preco_base: number;
  margin_percent: number;
  preco_final: number;
  is_active: boolean;
  estoque: number;
  imagem: string | null;
  categorias: string;
  created_at?: string;
  produto_ativo: boolean;
  pode_ativar: boolean;
}

export default function RevendedoraProProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoComMargem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [franqueadaDominio, setFranqueadaDominio] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [estoqueFiltro, setEstoqueFiltro] = useState<'todos' | 'disponivel' | 'esgotado'>('todos');
  const [margemFiltro, setMargemFiltro] = useState<'todos' | 'configurada' | 'pendente'>('todos');
  const [showModalMargem, setShowModalMargem] = useState(false);
  const [margemValor, setMargemValor] = useState('');
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const buscaDebounced = useDebounce(busca, 300);
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: franqueada } = await supabase.from('franqueadas').select('id').eq('user_id', user.id).single();
      if (!franqueada) return;
      const { data: loja } = await supabase.from('lojas').select('dominio').eq('franqueada_id', franqueada.id).single();
      if (loja?.dominio) setFranqueadaDominio(loja.dominio);
      const { data: vinculacoes } = await supabase.from('produtos_franqueadas')
        .select('id, produto_id, produtos:produto_id (id, nome, preco_base, estoque, ativo, imagem, created_at)')
        .eq('franqueada_id', franqueada.id);
      if (!vinculacoes || vinculacoes.length === 0) { setProdutos([]); return; }
      const vinculacaoIds = vinculacoes.map(v => v.id);
      const { data: precos } = await supabase.from('produtos_franqueadas_precos').select('*').in('produto_franqueada_id', vinculacaoIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const produtosFormatados = vinculacoes.map((v: any) => {
        const produto = Array.isArray(v.produtos) ? v.produtos[0] : v.produtos;
        if (!produto) return null;
        const preco = precos?.find(p => p.produto_franqueada_id === v.id);
        const categorias = 'Sem categoria'; // Simplificado por enquanto
        let margemPercentual = 0, precoFinal = produto.preco_base || 0;
        if (preco?.ajuste_tipo === 'porcentagem' && preco?.ajuste_valor) { margemPercentual = preco.ajuste_valor; precoFinal = (produto.preco_base || 0) * (1 + preco.ajuste_valor / 100); }
        else if (preco?.ajuste_tipo === 'fixo' && preco?.ajuste_valor) { precoFinal = (produto.preco_base || 0) + preco.ajuste_valor; margemPercentual = produto.preco_base ? (preco.ajuste_valor / produto.preco_base) * 100 : 0; }
        return { id: String(produto.id), produto_franqueada_id: v.id, nome: produto.nome || '', preco_base: produto.preco_base || 0, margin_percent: margemPercentual, preco_final: precoFinal, is_active: preco?.ativo_no_site || false, estoque: produto.estoque || 0, imagem: produto.imagem || null, categorias, created_at: produto.created_at, produto_ativo: produto.ativo || false, pode_ativar: (produto.ativo || false) && (produto.estoque || 0) > 0 } as ProdutoComMargem;
      }).filter((p): p is ProdutoComMargem => p !== null);
      setProdutos(produtosFormatados);
    } catch (err) { console.error('Erro:', err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);
  const toggleAtivacao = async (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
    if (!produto.is_active && !produto.pode_ativar) { toast.error('Este produto nao pode ser ativado'); return; }
    if (!produto.is_active && produto.margin_percent === 0) { toast.warning('Configure a margem antes de ativar'); return; }
    try {
      const novoStatus = !produto.is_active;
      await createClient().from('produtos_franqueadas_precos').upsert({ produto_franqueada_id: produto.produto_franqueada_id, preco_base: produto.preco_base, ajuste_tipo: produto.margin_percent > 0 ? 'porcentagem' : null, ajuste_valor: produto.margin_percent || null, preco_final: produto.preco_final, ativo_no_site: novoStatus, atualizado_em: new Date().toISOString() }, { onConflict: 'produto_franqueada_id' });
      await carregarDados();
      toast.success(novoStatus ? 'Produto ativado!' : 'Produto desativado!');
    } catch { toast.error('Erro ao alterar status'); }
  };

  const toggleAtivacaoEmMassa = async (ativar: boolean) => {
    if (selectedIds.size === 0) return;
    const selecionados = produtos.filter(p => selectedIds.has(p.id));
    if (ativar) {
      if (selecionados.some(p => p.margin_percent === 0)) { toast.warning('Alguns produtos sem margem configurada'); return; }
      if (selecionados.some(p => !p.pode_ativar)) { toast.warning('Alguns produtos nao disponiveis'); return; }
    }
    setProcessando(true);
    try {
      for (const produto of selecionados) {
        await createClient().from('produtos_franqueadas_precos').upsert({ produto_franqueada_id: produto.produto_franqueada_id, preco_base: produto.preco_base, ajuste_tipo: produto.margin_percent > 0 ? 'porcentagem' : null, ajuste_valor: produto.margin_percent || null, preco_final: produto.preco_final, ativo_no_site: ativar, atualizado_em: new Date().toISOString() }, { onConflict: 'produto_franqueada_id' });
      }
      await carregarDados(); setSelectedIds(new Set());
      toast.success(ativar ? 'Produtos ativados!' : 'Produtos desativados!');
    } catch { toast.error('Erro'); } finally { setProcessando(false); }
  };

  const aplicarMargemEmMassa = async () => {
    if (selectedIds.size === 0 || !margemValor) return;
    const valor = parseFloat(margemValor);
    if (isNaN(valor) || valor < 0) { toast.warning('Digite um valor valido'); return; }
    setProcessando(true);
    try {
      const selecionados = produtos.filter(p => selectedIds.has(p.id));
      for (const produto of selecionados) {
        const margemPercentual = valor;
        const novoPrecoFinal = produto.preco_base * (1 + valor / 100);
        await createClient().from('produtos_franqueadas_precos').upsert({ produto_franqueada_id: produto.produto_franqueada_id, preco_base: produto.preco_base, ajuste_tipo: 'porcentagem', ajuste_valor: margemPercentual, preco_final: novoPrecoFinal, ativo_no_site: produto.is_active, atualizado_em: new Date().toISOString() }, { onConflict: 'produto_franqueada_id' });
      }
      await carregarDados(); setShowModalMargem(false); setMargemValor(''); setSelectedIds(new Set());
      toast.success('Margem aplicada!');
    } catch { toast.error('Erro ao aplicar margem'); } finally { setProcessando(false); }
  };

  const copiarLinkProduto = (produtoId: string) => {
    if (!franqueadaDominio) { toast.error("Dominio nao configurado"); return; }
    navigator.clipboard.writeText(`${window.location.origin}/loja/${franqueadaDominio}/produto/${produtoId}`);
    setCopiedProductId(produtoId); toast.success("Link copiado!");
    setTimeout(() => setCopiedProductId(null), 2000);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === produtosFiltrados.length && produtosFiltrados.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(produtosFiltrados.map(p => p.id)));
  };

  const produtosFiltrados = useMemo(() => {
    let resultado = [...produtos];
    if (buscaDebounced) { const termo = buscaDebounced.toLowerCase(); resultado = resultado.filter(p => p.nome.toLowerCase().includes(termo) || p.categorias.toLowerCase().includes(termo) || p.id.includes(termo)); }
    if (statusFiltro !== "todos") resultado = resultado.filter(p => statusFiltro === "ativo" ? p.is_active : !p.is_active);
    if (margemFiltro !== "todos") resultado = resultado.filter(p => margemFiltro === "configurada" ? p.margin_percent > 0 : p.margin_percent === 0);
    if (estoqueFiltro !== "todos") resultado = resultado.filter(p => estoqueFiltro === "disponivel" ? p.estoque > 0 : p.estoque === 0);
    return resultado.sort((a, b) => {
      const dataLimite = new Date(); dataLimite.setDate(dataLimite.getDate() - 30);
      const aIsNew = a.created_at && new Date(a.created_at) >= dataLimite;
      const bIsNew = b.created_at && new Date(b.created_at) >= dataLimite;
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      return a.nome.localeCompare(b.nome);
    });
  }, [produtos, buscaDebounced, statusFiltro, margemFiltro, estoqueFiltro]);

  const stats = useMemo(() => ({
    total: produtos.length,
    semMargem: produtos.filter(p => p.margin_percent === 0).length,
    prontos: produtos.filter(p => p.margin_percent > 0 && !p.is_active && p.pode_ativar).length,
    ativos: produtos.filter(p => p.is_active).length
  }), [produtos]);

  if (loading) return (<div className="min-h-screen flex items-center justify-center"><div className="text-center"><Loader2 className="w-8 h-8 animate-spin text-pink-600 mx-auto mb-2" /><p className="text-gray-600">Carregando produtos...</p></div></div>);

  return (
    <div className="p-4 lg:p-6 space-y-4 pb-32 lg:pb-6 w-full">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-pink-100 rounded-lg"><Package className="w-6 h-6 text-pink-600" /></div>
        <div><h1 className="text-xl font-bold text-gray-900">Produtos</h1><p className="text-sm text-gray-500">Gerencie margens de lucro e disponibilidade dos produtos na sua loja</p></div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-50 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-xs text-gray-500">Total de Produtos</p></div></div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="flex items-center gap-3"><div className="p-2 bg-yellow-50 rounded-lg"><AlertCircle className="w-5 h-5 text-yellow-600" /></div><div><p className="text-2xl font-bold text-yellow-600">{stats.semMargem}</p><p className="text-xs text-gray-500">Sem Margem</p><p className="text-[10px] text-gray-400">Precisam de configuracao</p></div></div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-50 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-600" /></div><div><p className="text-2xl font-bold text-purple-600">{stats.prontos}</p><p className="text-xs text-gray-500">Prontos para Ativar</p></div></div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">{stats.ativos}</p><p className="text-xs text-gray-500">Ativos no Site</p></div></div></div>
      </div>

      {/* Botão destacado para aplicar margem em todos */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-4 shadow-lg">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <h3 className="text-lg font-bold text-white">Configure sua margem de lucro rapidamente!</h3>
            </div>
            <p className="text-pink-50 text-sm">
              Selecione todos os produtos e aplique a mesma margem de uma vez. Economize tempo!
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedIds(new Set(produtos.map(p => p.id)));
              setShowModalMargem(true);
            }}
            className="w-full lg:w-auto px-6 py-3 bg-white text-pink-600 rounded-lg font-bold hover:bg-pink-50 transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2"
            style={{ minHeight: '44px' }}
          >
            <Percent className="w-5 h-5" />
            <span>Aplicar Margem em Todos</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Filter className="w-5 h-5 text-gray-400" /><span className="font-medium text-gray-700">Filtros</span></div>
          <button onClick={() => setFiltrosAbertos(!filtrosAbertos)} className="lg:hidden text-sm text-pink-600 flex items-center gap-1">{filtrosAbertos ? "Ocultar" : "Mostrar"} {filtrosAbertos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${filtrosAbertos ? "block" : "hidden"} lg:grid`}>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Buscar Produto</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou ID do produto..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500" /></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Status no Site</label><select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as "todos" | "ativo" | "inativo")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"><option value="todos">Todos os status</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label><select value={estoqueFiltro} onChange={(e) => setEstoqueFiltro(e.target.value as "todos" | "disponivel" | "esgotado")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"><option value="todos">Todos</option><option value="disponivel">Disponivel</option><option value="esgotado">Esgotado</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Margem de Lucro</label><select value={margemFiltro} onChange={(e) => setMargemFiltro(e.target.value as "todos" | "configurada" | "pendente")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"><option value="todos">Todos</option><option value="configurada">Configurada</option><option value="pendente">Pendente</option></select></div>
        </div>
      </div>


      {selectedIds.size > 0 && (<div className="hidden lg:flex bg-pink-50 border border-pink-200 rounded-xl p-4 items-center justify-between"><div className="flex items-center gap-3"><span className="font-medium text-gray-900">{selectedIds.size} produto{selectedIds.size > 1 ? "s" : ""} selecionado{selectedIds.size > 1 ? "s" : ""}</span><button onClick={() => setSelectedIds(new Set())} className="text-sm text-gray-600 hover:text-gray-800">Limpar selecao</button></div><div className="flex gap-2"><button onClick={() => toggleAtivacaoEmMassa(true)} disabled={processando} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"><Eye className="w-4 h-4" />Ativar</button><button onClick={() => toggleAtivacaoEmMassa(false)} disabled={processando} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"><EyeOff className="w-4 h-4" />Desativar</button><button onClick={() => setShowModalMargem(true)} disabled={processando} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"><Percent className="w-4 h-4" />Definir Margem</button></div></div>)}

      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left w-12"><input type="checkbox" checked={selectedIds.size === produtosFiltrados.length && produtosFiltrados.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Preco Base</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Margem</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Preco Final</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {produtosFiltrados.map(produto => {
                const isNew = produto.created_at && new Date(produto.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                return (
                  <tr key={produto.id} className={`hover:bg-gray-50 ${selectedIds.has(produto.id) ? "bg-pink-50" : ""}`}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(produto.id)} onChange={() => { const n = new Set(selectedIds); if (n.has(produto.id)) n.delete(produto.id); else n.add(produto.id); setSelectedIds(n); }} className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" /></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-3">{produto.imagem ? <Image src={produto.imagem} alt={produto.nome} width={40} height={40} className="rounded-lg object-cover" /> : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>}<div className="flex items-center gap-2"><span className="font-medium text-gray-900 line-clamp-1">{produto.nome}</span>{isNew && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-pink-100 text-pink-700 text-[10px] font-medium rounded"><Sparkles className="w-3 h-3" />NOVO</span>}</div></div></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{produto.categorias}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">R$ {produto.preco_base.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${produto.margin_percent > 0 ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{produto.margin_percent > 0 ? `${produto.margin_percent.toFixed(1)}%` : "Pendente"}</span></td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">R$ {produto.preco_final.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${produto.estoque > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{produto.estoque > 0 ? `${produto.estoque} un` : "Esgotado"}</span></td>
                    <td className="px-4 py-3 text-center"><button onClick={() => toggleAtivacao(produto.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${produto.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{produto.is_active ? <><Eye className="w-3.5 h-3.5" />Ativo</> : <><EyeOff className="w-3.5 h-3.5" />Inativo</>}</button></td>
                    <td className="px-4 py-3 text-center"><button onClick={() => copiarLinkProduto(produto.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">{copiedProductId === produto.id ? <><Check className="w-3.5 h-3.5" />Copiado!</> : <><Link2 className="w-3.5 h-3.5" />Copiar Link</>}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {produtosFiltrados.length === 0 && <div className="text-center py-12"><Package className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Nenhum produto encontrado</p></div>}
      </div>


      <div className="lg:hidden space-y-3">
        <div className="flex items-center justify-between px-1"><label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={selectedIds.size === produtosFiltrados.length && produtosFiltrados.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />Selecionar todos</label><span className="text-sm text-gray-500">{produtosFiltrados.length} produtos</span></div>
        {produtosFiltrados.map(produto => (
          <div key={produto.id} className={`bg-white rounded-xl border-2 p-4 transition-colors ${selectedIds.has(produto.id) ? "border-pink-500" : "border-gray-200"}`}>
            <div className="flex items-start gap-3 mb-3">
              <input type="checkbox" checked={selectedIds.has(produto.id)} onChange={() => { const n = new Set(selectedIds); if (n.has(produto.id)) n.delete(produto.id); else n.add(produto.id); setSelectedIds(n); }} className="rounded border-gray-300 text-pink-600 focus:ring-pink-500 mt-1" />
              {produto.imagem ? <Image src={produto.imagem} alt={produto.nome} width={56} height={56} className="rounded-lg object-cover flex-shrink-0" /> : <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><Package className="w-6 h-6 text-gray-400" /></div>}
              <div className="flex-1 min-w-0"><h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{produto.nome}</h3><p className="text-xs text-gray-500 mt-0.5">{produto.categorias}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-[10px] text-gray-500 uppercase">Base</p><p className="text-sm font-medium text-gray-700">R$ {produto.preco_base.toFixed(2)}</p></div>
              <div className="bg-pink-50 rounded-lg p-2 text-center"><p className="text-[10px] text-gray-500 uppercase">Margem</p><p className={`text-sm font-bold ${produto.margin_percent > 0 ? "text-pink-600" : "text-yellow-600"}`}>{produto.margin_percent > 0 ? `${produto.margin_percent.toFixed(1)}%` : "Pendente"}</p></div>
              <div className="bg-green-50 rounded-lg p-2 text-center"><p className="text-[10px] text-gray-500 uppercase">Final</p><p className="text-sm font-bold text-green-600">R$ {produto.preco_final.toFixed(2)}</p></div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${produto.estoque > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{produto.estoque > 0 ? `${produto.estoque} un` : "Esgotado"}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleAtivacao(produto.id)} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${produto.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{produto.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}{produto.is_active ? "Ativo" : "Inativo"}</button>
                <button onClick={() => copiarLinkProduto(produto.id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-pink-600 bg-pink-50 rounded-full">{copiedProductId === produto.id ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}{copiedProductId === produto.id ? "Copiado!" : "Link"}</button>
              </div>
            </div>
          </div>
        ))}
        {produtosFiltrados.length === 0 && <div className="text-center py-12 bg-white rounded-xl border border-gray-200"><Package className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Nenhum produto encontrado</p></div>}
      </div>


      {selectedIds.size > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-2xl shadow-xl p-4 z-50">
          <p className="text-sm font-medium text-center mb-3">{selectedIds.size} produto(s) selecionado(s)</p>
          <div className="flex gap-2">
            <button onClick={() => toggleAtivacaoEmMassa(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm"><Eye className="w-4 h-4" />Ativar</button>
            <button onClick={() => toggleAtivacaoEmMassa(false)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm"><EyeOff className="w-4 h-4" />Desativar</button>
            <button onClick={() => setShowModalMargem(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm"><Percent className="w-4 h-4" />Margem</button>
          </div>
        </div>
      )}

      {showModalMargem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aplicar Margem em Massa</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedIds.size} produto(s) selecionado(s)</p>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Margem (%)</label><input type="number" min="0" max="100" step="0.1" value={margemValor} onChange={(e) => setMargemValor(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Ex: 15" /></div>
            <div className="flex gap-3"><button onClick={() => setShowModalMargem(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium">Cancelar</button><button onClick={aplicarMargemEmMassa} disabled={processando || !margemValor} className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium disabled:opacity-50">{processando ? "Aplicando..." : "Aplicar"}</button></div>
          </div>
        </div>
      )}

      <VideoTutorialButton pagina="produtos" />
    </div>
  );
}