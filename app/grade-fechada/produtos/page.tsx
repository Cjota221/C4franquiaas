"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
} from 'lucide-react';

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco_base: number;
  ativo: boolean;
  created_at: string;
}

export default function ProdutosGradeFechadaPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/grade-fechada/produtos');
      const data = await response.json();

      if (response.ok) {
        setProdutos(data.data || []);
      } else {
        toast.error('Erro ao carregar produtos');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao conectar com servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Produtos - Grade Fechada
          </h1>
          <p className="text-gray-600">
            Cadastro e gestão de produtos para venda por encomenda
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, código..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-gray-600 text-sm mb-1">Total de Produtos</div>
          <div className="text-2xl font-bold text-gray-900">{produtos.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-600 text-sm mb-1">Ativos</div>
          <div className="text-2xl font-bold text-green-600">0</div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-600 text-sm mb-1">Inativos</div>
          <div className="text-2xl font-bold text-gray-400">0</div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-600 text-sm mb-1">Sem Estoque</div>
          <div className="text-2xl font-bold text-orange-600">0</div>
        </Card>
      </div>

      {/* Lista de Produtos */}
      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
        </Card>
      ) : produtos.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum produto cadastrado
          </h3>
          <p className="text-gray-600 mb-6">
            Comece cadastrando seu primeiro produto para grade fechada
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-5 w-5 mr-2" />
            Cadastrar Primeiro Produto
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {produtos.map((produto) => (
            <Card key={produto.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{produto.nome}</h3>
                  <p className="text-sm text-gray-600">{produto.codigo}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
