"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MapPin, MessageCircle, Instagram, Facebook } from 'lucide-react';

interface LojaContatoProps {
  loja: {
    telefone: string | null;
    email_contato: string | null;
    endereco: string | null;
    whatsapp: string | null;
    instagram: string | null;
    facebook: string | null;
  };
  onChange: (field: string, value: string) => void;
}

export default function LojaContatoSection({ loja, onChange }: LojaContatoProps) {
  const formatWhatsApp = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    // Formata como (XX) XXXXX-XXXX
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
  };

  return (
    <div className="space-y-6">
      {/* Contato Direto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações de Contato</CardTitle>
          <CardDescription>Como os clientes podem entrar em contato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* WhatsApp */}
          <div>
            <Label htmlFor="whatsapp" className="text-sm font-medium mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-600" />
              WhatsApp *
            </Label>
            <Input
              id="whatsapp"
              value={loja.whatsapp || ''}
              onChange={(e) => onChange('whatsapp', formatWhatsApp(e.target.value))}
              placeholder="(11) 99999-9999"
              className="w-full"
              maxLength={15}
            />
            <p className="text-xs text-gray-500 mt-1">
              Número principal para atendimento (com DDD)
            </p>
          </div>

          {/* Telefone */}
          <div>
            <Label htmlFor="telefone" className="text-sm font-medium mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              Telefone
            </Label>
            <Input
              id="telefone"
              value={loja.telefone || ''}
              onChange={(e) => onChange('telefone', formatPhone(e.target.value))}
              placeholder="(11) 3333-4444"
              className="w-full"
              maxLength={14}
            />
            <p className="text-xs text-gray-500 mt-1">Telefone fixo (opcional)</p>
          </div>

          {/* E-mail */}
          <div>
            <Label
              htmlFor="email_contato"
              className="text-sm font-medium mb-2 flex items-center gap-2"
            >
              <Mail className="w-4 h-4 text-purple-600" />
              E-mail de Contato
            </Label>
            <Input
              id="email_contato"
              type="email"
              value={loja.email_contato || ''}
              onChange={(e) => onChange('email_contato', e.target.value)}
              placeholder="contato@minhaloja.com.br"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">E-mail para atendimento ao cliente</p>
          </div>

          {/* Endereço */}
          <div>
            <Label htmlFor="endereco" className="text-sm font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              Endereço Completo
            </Label>
            <Textarea
              id="endereco"
              value={loja.endereco || ''}
              onChange={(e) => onChange('endereco', e.target.value)}
              placeholder="Rua Exemplo, 123 - Centro&#10;São Paulo - SP&#10;CEP: 01234-567"
              rows={3}
              className="w-full resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Endereço físico da loja (se tiver)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Redes Sociais</CardTitle>
          <CardDescription>Links para suas redes sociais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instagram */}
          <div>
            <Label htmlFor="instagram" className="text-sm font-medium mb-2 flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-600" />
              Instagram
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">@</span>
              <Input
                id="instagram"
                value={loja.instagram || ''}
                onChange={(e) =>
                  onChange('instagram', e.target.value.replace(/[^a-zA-Z0-9._]/g, ''))
                }
                placeholder="minhaloja"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Apenas o usuário, sem @ ou link completo</p>
          </div>

          {/* Facebook */}
          <div>
            <Label htmlFor="facebook" className="text-sm font-medium mb-2 flex items-center gap-2">
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 shrink-0">facebook.com/</span>
              <Input
                id="facebook"
                value={loja.facebook || ''}
                onChange={(e) => onChange('facebook', e.target.value)}
                placeholder="minhaloja"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Apenas o nome da página</p>
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-green-600 shrink-0">💡</div>
            <div className="text-sm text-green-900 space-y-2">
              <p className="font-medium">Dicas para melhorar o atendimento:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  O <strong>WhatsApp</strong> é essencial - a maioria dos clientes prefere esse
                  canal
                </li>
                <li>Mantenha suas redes sociais atualizadas para gerar confiança</li>
                <li>
                  Se tiver loja física, o endereço completo ajuda clientes a te encontrarem
                </li>
                <li>Responda rápido às mensagens para aumentar as vendas!</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
