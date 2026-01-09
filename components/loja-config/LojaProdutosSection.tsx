"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Package, ShoppingCart } from 'lucide-react';

interface LojaProdutosProps {
  loja: {
    mostrar_estoque: boolean;
    mostrar_codigo_barras: boolean;
    permitir_carrinho: boolean;
    modo_catalogo: boolean;
    mensagem_whatsapp: string | null;
  };
  onChange: (field: string, value: boolean | string) => void;
}

export default function LojaProdutosSection({ loja, onChange }: LojaProdutosProps) {
  return (
    <div className="space-y-6">
      {/* Exibição de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            Exibição de Produtos
          </CardTitle>
          <CardDescription>Como os produtos aparecem na loja</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label className="text-sm font-medium block mb-1">
                Mostrar Quantidade em Estoque
              </Label>
              <p className="text-xs text-gray-600">
                Exibe &quot;X unidades disponíveis&quot; nos produtos
              </p>
            </div>
            <Switch
              checked={loja.mostrar_estoque}
              onCheckedChange={(checked) => onChange('mostrar_estoque', checked)}
            />
          </div>

          <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label className="text-sm font-medium block mb-1">
                Mostrar Código de Barras
              </Label>
              <p className="text-xs text-gray-600">
                Exibe o código de barras na página do produto
              </p>
            </div>
            <Switch
              checked={loja.mostrar_codigo_barras}
              onCheckedChange={(checked) => onChange('mostrar_codigo_barras', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Carrinho e Compras */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Carrinho e Compras
          </CardTitle>
          <CardDescription>Configurações de como os clientes compram</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label className="text-sm font-medium block mb-1">Permitir Carrinho</Label>
              <p className="text-xs text-gray-600">
                Clientes podem adicionar produtos ao carrinho e finalizar compra
              </p>
            </div>
            <Switch
              checked={loja.permitir_carrinho}
              onCheckedChange={(checked) => onChange('permitir_carrinho', checked)}
            />
          </div>

          <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label className="text-sm font-medium block mb-1">Modo Catálogo</Label>
              <p className="text-xs text-gray-600">
                Esconde preços e botão de comprar. Clientes pedem orçamento via WhatsApp
              </p>
            </div>
            <Switch
              checked={loja.modo_catalogo}
              onCheckedChange={(checked) => onChange('modo_catalogo', checked)}
            />
          </div>

          {/* Mensagem WhatsApp */}
          <div className="pt-4 border-t">
            <Label htmlFor="mensagem_whatsapp" className="text-sm font-medium mb-2 block">
              Mensagem Padrão do WhatsApp
            </Label>
            <Textarea
              id="mensagem_whatsapp"
              value={loja.mensagem_whatsapp || ''}
              onChange={(e) => onChange('mensagem_whatsapp', e.target.value)}
              placeholder="Olá! Gostaria de saber mais sobre este produto:"
              rows={3}
              className="w-full resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Texto que será enviado automaticamente quando o cliente clicar em &quot;Comprar via
              WhatsApp&quot;
            </p>
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800">
                <strong>Dica:</strong> Use variáveis como {'{produto}'} para incluir o nome do
                produto automaticamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avisos Importantes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-blue-600 shrink-0">ℹ️</div>
            <div className="text-sm text-blue-900 space-y-2">
              <p className="font-medium">Importante:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  Se <strong>Modo Catálogo</strong> estiver ativo, os preços não aparecerão
                </li>
                <li>
                  <strong>Permitir Carrinho</strong> deve estar ativo para vendas online
                </li>
                <li>No modo catálogo, clientes entram em contato por WhatsApp para comprar</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
