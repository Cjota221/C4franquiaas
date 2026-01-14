"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { PackageOpen, ShoppingCart, Settings, Package } from 'lucide-react';

export default function EncomendasPage() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      id: 'produtos',
      title: 'Produtos (Grade Fechada)',
      description: 'Cadastro e gestão de produtos para venda por grade',
      icon: Package,
      href: '/admin/encomendas/produtos',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'pedidos',
      title: 'Pedidos de Encomenda',
      description: 'Visualizar e gerenciar pedidos por grade fechada',
      icon: PackageOpen,
      href: '/admin/encomendas/pedidos',
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'carrinhos',
      title: 'Carrinhos Abandonados',
      description: 'Acompanhar carrinhos não finalizados',
      icon: ShoppingCart,
      href: '/admin/encomendas/carrinhos',
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 'configuracoes',
      title: 'Configurações do Site',
      description: 'Configurar regras, mensagens e parâmetros',
      icon: Settings,
      href: '/admin/encomendas/configuracoes',
      color: 'from-gray-500 to-gray-600',
    },
  ];

  return (
    <PageWrapper title="Painel de Encomendas">
      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader
          title="Painel de Encomendas por Grade Fechada"
          subtitle="Sistema de pedidos B2B com personalização e montagem de grades"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-pink-300"
                onClick={() => router.push(item.href)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${item.color}`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Informações importantes */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📋 Regras do Sistema de Encomendas
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-pink-600 font-bold">•</span>
              <span>Pedido mínimo: 2 grades do mesmo modelo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-600 font-bold">•</span>
              <span>Prazo de produção: 15 a 20 dias úteis após confirmação de pagamento</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-600 font-bold">•</span>
              <span>Não há pagamento online no site</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-600 font-bold">•</span>
              <span>Não há cálculo automático de frete</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-600 font-bold">•</span>
              <span>O site serve para montar pedidos e gerar orçamento via WhatsApp</span>
            </li>
          </ul>
        </Card>
      </div>
    </PageWrapper>
  );
}
