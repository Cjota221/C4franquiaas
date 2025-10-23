"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomizacoesHeader from '@/components/franqueada/customizacoes/CustomizacoesHeader';
import CustomizacoesPaginaInicial from '@/components/franqueada/customizacoes/CustomizacoesPaginaInicial';
import CustomizacoesProdutos from '@/components/franqueada/customizacoes/CustomizacoesProdutos';
import CustomizacoesCarrinho from '@/components/franqueada/customizacoes/CustomizacoesCarrinho';
import CustomizacoesComunicacao from '@/components/franqueada/customizacoes/CustomizacoesComunicacao';
import CustomizacoesPromocoes from '@/components/franqueada/customizacoes/CustomizacoesPromocoes';
import CustomizacoesAvancado from '@/components/franqueada/customizacoes/CustomizacoesAvancado';

export default function CustomizacoesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Customizações Avançadas</h1>
        <p className="text-gray-600">Personalize completamente a aparência e funcionalidades da sua loja</p>
      </div>

      <Tabs defaultValue="header" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto">
          <TabsTrigger value="header">Header e Menu</TabsTrigger>
          <TabsTrigger value="home">Página Inicial</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="carrinho">Carrinho</TabsTrigger>
          <TabsTrigger value="comunicacao">Comunicação</TabsTrigger>
          <TabsTrigger value="promocoes">Promoções</TabsTrigger>
          <TabsTrigger value="avancado">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="header">
          <CustomizacoesHeader />
        </TabsContent>

        <TabsContent value="home">
          <CustomizacoesPaginaInicial />
        </TabsContent>

        <TabsContent value="produtos">
          <CustomizacoesProdutos />
        </TabsContent>

        <TabsContent value="carrinho">
          <CustomizacoesCarrinho />
        </TabsContent>

        <TabsContent value="comunicacao">
          <CustomizacoesComunicacao />
        </TabsContent>

        <TabsContent value="promocoes">
          <CustomizacoesPromocoes />
        </TabsContent>

        <TabsContent value="avancado">
          <CustomizacoesAvancado />
        </TabsContent>
      </Tabs>
    </div>
  );
}
