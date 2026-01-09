"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Search, BarChart, Code, Eye, EyeOff } from 'lucide-react';

interface LojaSeoProps {
  loja: {
    meta_title: string | null;
    meta_description: string | null;
    google_analytics: string | null;
    facebook_pixel: string | null;
    ativo: boolean;
  };
  onChange: (field: string, value: string | boolean) => void;
}

export default function LojaSeoSection({ loja, onChange }: LojaSeoProps) {
  return (
    <div className="space-y-6">
      {/* Status da Loja */}
      <Card className={loja.ativo ? 'border-green-300 bg-green-50' : 'border-gray-300'}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {loja.ativo ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-gray-600" />}
            Status da Loja
          </CardTitle>
          <CardDescription>
            {loja.ativo
              ? 'Sua loja está ativa e visível para os clientes'
              : 'Sua loja está desativada e não pode ser acessada'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4 p-4 bg-white rounded-lg border-2">
            <div className="flex-1">
              <Label className="text-sm font-medium block mb-1">Loja Online Ativa</Label>
              <p className="text-xs text-gray-600">
                Desative para fazer manutenção ou pausar temporariamente as vendas
              </p>
            </div>
            <Switch
              checked={loja.ativo}
              onCheckedChange={(checked) => onChange('ativo', checked)}
              className="shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5" />
            SEO (Otimização para Buscadores)
          </CardTitle>
          <CardDescription>
            Ajuda sua loja a aparecer melhor no Google
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meta Title */}
          <div>
            <Label htmlFor="meta_title" className="text-sm font-medium mb-2 block">
              Título da Página (Meta Title)
            </Label>
            <Input
              id="meta_title"
              value={loja.meta_title || ''}
              onChange={(e) => onChange('meta_title', e.target.value)}
              placeholder="Ex: Minha Loja - Produtos de Qualidade"
              className="w-full"
              maxLength={60}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                Aparece na aba do navegador e no Google
              </p>
              <span className="text-xs text-gray-400">
                {loja.meta_title?.length || 0}/60
              </span>
            </div>
          </div>

          {/* Meta Description */}
          <div>
            <Label htmlFor="meta_description" className="text-sm font-medium mb-2 block">
              Descrição da Página (Meta Description)
            </Label>
            <Textarea
              id="meta_description"
              value={loja.meta_description || ''}
              onChange={(e) => onChange('meta_description', e.target.value)}
              placeholder="Loja online com produtos de qualidade, preços especiais e entrega rápida. Confira!"
              rows={3}
              className="w-full resize-none"
              maxLength={160}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                Aparece abaixo do título nos resultados do Google
              </p>
              <span className="text-xs text-gray-400">
                {loja.meta_description?.length || 0}/160
              </span>
            </div>
          </div>

          {/* Dicas de SEO */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-2">
              <div className="text-blue-600 shrink-0">💡</div>
              <div className="text-xs text-blue-900 space-y-1">
                <p className="font-medium">Dicas para melhorar no Google:</p>
                <ul className="list-disc list-inside space-y-0.5 mt-1">
                  <li>Use palavras-chave que seus clientes buscam</li>
                  <li>Seja claro e objetivo na descrição</li>
                  <li>Inclua o nome da sua cidade se tiver loja física</li>
                  <li>Exemplo: &quot;Roupas Femininas em São Paulo - Entrega Rápida&quot;</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Análise e Métricas
          </CardTitle>
          <CardDescription>
            Rastreie visitantes e comportamento dos clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Analytics */}
          <div>
            <Label htmlFor="google_analytics" className="text-sm font-medium mb-2 block">
              Google Analytics (GA4)
            </Label>
            <Input
              id="google_analytics"
              value={loja.google_analytics || ''}
              onChange={(e) => onChange('google_analytics', e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="w-full font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID de medição do Google Analytics 4
            </p>
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
            >
              Como obter meu ID do Google Analytics →
            </a>
          </div>

          {/* Facebook Pixel */}
          <div>
            <Label htmlFor="facebook_pixel" className="text-sm font-medium mb-2 block">
              Facebook Pixel
            </Label>
            <Input
              id="facebook_pixel"
              value={loja.facebook_pixel || ''}
              onChange={(e) => onChange('facebook_pixel', e.target.value)}
              placeholder="123456789012345"
              className="w-full font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID do Pixel do Facebook para anúncios
            </p>
            <a
              href="https://business.facebook.com/events_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
            >
              Como criar meu Facebook Pixel →
            </a>
          </div>

          {/* Info sobre Analytics */}
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex gap-2">
              <div className="text-purple-600 shrink-0">ℹ️</div>
              <div className="text-xs text-purple-900 space-y-1">
                <p className="font-medium">Por que usar ferramentas de análise?</p>
                <ul className="list-disc list-inside space-y-0.5 mt-1">
                  <li>Saber quantas pessoas visitam sua loja</li>
                  <li>Ver quais produtos são mais visualizados</li>
                  <li>Entender de onde vêm seus clientes</li>
                  <li>Melhorar suas estratégias de venda</li>
                </ul>
                <p className="mt-2 italic">
                  Opcional: preencha apenas se você usa essas ferramentas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção Avançada (Placeholder para futuras funcionalidades) */}
      <Card className="border-gray-300">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="w-5 h-5" />
            Configurações Avançadas
          </CardTitle>
          <CardDescription>
            Funcionalidades adicionais (em breve)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Recursos avançados em desenvolvimento</p>
            <p className="text-xs mt-1">
              Em breve você poderá adicionar códigos personalizados e integrações
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
