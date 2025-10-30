"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomizacoesHeader from '@/components/franqueada/customizacoes/CustomizacoesHeader';
import CustomizacoesPaginaInicial from '@/components/franqueada/customizacoes/CustomizacoesPaginaInicial';
import CustomizacoesProdutos from '@/components/franqueada/customizacoes/CustomizacoesProdutos';
import CustomizacoesCarrinho from '@/components/franqueada/customizacoes/CustomizacoesCarrinho';
import CustomizacoesComunicacao from '@/components/franqueada/customizacoes/CustomizacoesComunicacao';
import CustomizacoesPromocoes from '@/components/franqueada/customizacoes/CustomizacoesPromocoes';
import CustomizacoesAvancado from '@/components/franqueada/customizacoes/CustomizacoesAvancado';
import MercadoPagoConfigWrapper from '@/components/franqueada/MercadoPagoConfigWrapper';

export default function CustomizacoesPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Customizações Avançadas</h1>
        <p className="text-sm md:text-base text-gray-600">Personalize completamente a aparência e funcionalidades da sua loja</p>
      </div>

      <Tabs defaultValue="header" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 lg:w-auto h-auto">
          <TabsTrigger value="header" className="text-xs sm:text-sm">Header e Menu</TabsTrigger>
          <TabsTrigger value="home" className="text-xs sm:text-sm">Página Inicial</TabsTrigger>
          <TabsTrigger value="produtos" className="text-xs sm:text-sm">Produtos</TabsTrigger>
          <TabsTrigger value="carrinho" className="text-xs sm:text-sm">Carrinho</TabsTrigger>
          <TabsTrigger value="pagamentos" className="text-xs sm:text-sm">Pagamentos</TabsTrigger>
          <TabsTrigger value="comunicacao" className="text-xs sm:text-sm">Comunicação</TabsTrigger>
          <TabsTrigger value="promocoes" className="text-xs sm:text-sm">Promoções</TabsTrigger>
          <TabsTrigger value="avancado" className="text-xs sm:text-sm">Avançado</TabsTrigger>
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

        <TabsContent value="pagamentos">
          <MercadoPagoConfigWrapper />
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
