"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomizacoesHeader from '@/components/franqueada/customizacoes/CustomizacoesHeader';
import CustomizacoesPaginaInicial from '@/components/franqueada/customizacoes/CustomizacoesPaginaInicial';
import CustomizacoesProdutos from '@/components/franqueada/customizacoes/CustomizacoesProdutos';
import CustomizacoesCarrinho from '@/components/franqueada/customizacoes/CustomizacoesCarrinho';
import CustomizacoesComunicacao from '@/components/franqueada/customizacoes/CustomizacoesComunicacao';
import CustomizacoesPromocoes from '@/components/franqueada/customizacoes/CustomizacoesPromocoes';
import CustomizacoesAvancado from '@/components/franqueada/customizacoes/CustomizacoesAvancado';
import { PageHeader } from '@/components/ui/PageHeader';
import { Sliders } from 'lucide-react';

export default function CustomizacoesPage() {
  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="Personalizacao"
        subtitle="Personalize completamente a aparencia e funcionalidades da sua loja"
        icon={Sliders}
      />

      <Tabs defaultValue="header" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 lg:w-auto h-auto">
          <TabsTrigger value="header" className="text-xs sm:text-sm">Header e Menu</TabsTrigger>
          <TabsTrigger value="home" className="text-xs sm:text-sm">Pagina Inicial</TabsTrigger>
          <TabsTrigger value="produtos" className="text-xs sm:text-sm">Produtos</TabsTrigger>
          <TabsTrigger value="carrinho" className="text-xs sm:text-sm">Carrinho</TabsTrigger>
          <TabsTrigger value="comunicacao" className="text-xs sm:text-sm">Comunicacao</TabsTrigger>
          <TabsTrigger value="promocoes" className="text-xs sm:text-sm">Promocoes</TabsTrigger>
          <TabsTrigger value="avancado" className="text-xs sm:text-sm">Avancado</TabsTrigger>
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
