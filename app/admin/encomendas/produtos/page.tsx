"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import Image from 'next/image';
import type { GradeFechadaProduto } from '@/types/grade-fechada';

export default function ProdutosGradeFechadaPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<GradeFechadaProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const fetchProdutos = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filtroAtivo !== 'todos') {
        params.append('ativo', filtroAtivo === 'ativo' ? 'true' : 'false');
      }

      const response = await fetch(`/api/admin/grade-fechada/produtos?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProdutos(data.data || []);
      } else {
        toast.error('Erro ao carregar produtos');
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [filtroAtivo]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const handleToggleAtivo = async (produto: GradeFechadaProduto) => {
    try {
      const response = await fetch(`/api/admin/grade-fechada/produtos/${produto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !produto.ativo }),
      });

      if (response.ok) {
        toast.success(`Produto ${produto.ativo ? 'desativado' : 'ativado'} com sucesso`);
        fetchProdutos();
      } else {
        toast.error('Erro ao atualizar produto');
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const response = await fetch(`/api/admin/grade-fechada/produtos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Produto excluído com sucesso');
        fetchProdutos();
      } else {
        toast.error('Erro ao excluir produto');
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigo_interno?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageWrapper title="Produtos - Grade Fechada">
      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader
          title="Produtos - Grade Fechada"
          subtitle="Cadastro e gestão de produtos para venda por grade"
        />

        {/* Barra de ações */}
        <div className="flex flex-col md:flex-row gap-4 mt-6 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filtroAtivo}
              onChange={(e) => setFiltroAtivo(e.target.value as 'todos' | 'ativo' | 'inativo')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>

            <Button
              onClick={() => router.push('/admin/encomendas/produtos/novo')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Lista de produtos */}
        {loading ? (
          <LoadingState message="Carregando produtos..." />
        ) : produtosFiltrados.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum produto encontrado"
            description="Comece cadastrando seu primeiro produto de grade fechada"
            action={
              <Button onClick={() => router.push('/admin/encomendas/produtos/novo')}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Produto
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {produtosFiltrados.map((produto) => (
              <Card
                key={produto.id}
                className={`p-4 ${!produto.ativo ? 'opacity-60' : ''}`}
              >
                {/* Imagem do produto */}
                <div className="relative w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  {produto.imagens && produto.imagens.length > 0 ? (
                    <Image
                      src={produto.imagens[0]}
                      alt={produto.nome}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Badge de status */}
                  <div className="absolute top-2 right-2">
                    {produto.ativo ? (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Ativo
                      </span>
                    ) : (
                      <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                        Inativo
                      </span>
                    )}
                  </div>
                </div>

                {/* Informações */}
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {produto.nome}
                  </h3>
                  {produto.codigo_interno && (
                    <p className="text-sm text-gray-500 mb-2">
                      Código: {produto.codigo_interno}
                    </p>
                  )}
                  
                  <div className="flex gap-2 text-sm text-gray-700 mb-2">
                    {produto.permite_meia_grade && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Meia Grade: R$ {produto.preco_meia_grade?.toFixed(2)}
                      </span>
                    )}
                    {produto.permite_grade_completa && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Grade: R$ {produto.preco_grade_completa?.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {produto.cores_disponiveis && produto.cores_disponiveis.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {produto.cores_disponiveis.length} cores disponíveis
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/admin/encomendas/produtos/${produto.id}`)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAtivo(produto)}
                  >
                    {produto.ativo ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(produto.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
