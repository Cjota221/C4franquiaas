"use client";
import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface LojaIdentidadeProps {
  loja: {
    nome: string;
    dominio: string;
    logo: string | null;
    cor_primaria: string;
    cor_secundaria: string;
    cor_texto: string;
    cor_fundo: string;
    cor_botao: string;
    cor_botao_hover: string;
    favicon: string | null;
    fonte_principal: string;
    fonte_secundaria: string;
  };
  onChange: (field: string, value: string | File) => void;
  onUpload: (field: string, file: File) => Promise<void>;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

export default function LojaIdentidadeSection({ loja, onChange, onUpload }: LojaIdentidadeProps) {
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileUpload = async (field: string, file: File) => {
    // Validações
    if (!ALLOWED_FORMATS.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WebP');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Imagem muito grande. Máximo 2MB');
      return;
    }

    setUploading(field);
    try {
      await onUpload(field, file);
      toast.success('Imagem enviada com sucesso!');
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Básicas</CardTitle>
          <CardDescription>Nome e domínio da sua loja</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nome" className="text-sm font-medium mb-2 block">
              Nome da Loja *
            </Label>
            <Input
              id="nome"
              value={loja.nome}
              onChange={(e) => onChange('nome', e.target.value)}
              placeholder="Ex: Minha Loja Incrível"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Este nome aparecerá no topo do site</p>
          </div>

          <div>
            <Label htmlFor="dominio" className="text-sm font-medium mb-2 block">
              Domínio *
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">/loja/</span>
              <Input
                id="dominio"
                value={loja.dominio}
                onChange={(e) => onChange('dominio', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="minha-loja"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Apenas letras, números e hífen</p>
          </div>
        </CardContent>
      </Card>

      {/* Logo e Favicon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Imagens da Loja
          </CardTitle>
          <CardDescription>Logo e ícone do navegador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Logo da Loja</Label>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {loja.logo && (
                <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center relative">
                  <Image src={loja.logo} alt="Logo" fill className="object-contain" unoptimized />
                </div>
              )}
              <div className="flex-1 w-full">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('logo', file);
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={uploading === 'logo'}
                  className="w-full sm:w-auto"
                  style={{ minHeight: '44px' }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading === 'logo' ? 'Enviando...' : 'Escolher Logo'}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Recomendado: 300x100px, PNG transparente. Máx: 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Favicon */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Favicon (Ícone do Navegador)</Label>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {loja.favicon && (
                <div className="w-16 h-16 border-2 border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center relative">
                  <Image src={loja.favicon} alt="Favicon" fill className="object-contain" unoptimized />
                </div>
              )}
              <div className="flex-1 w-full">
                <input
                  type="file"
                  id="favicon-upload"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('favicon', file);
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('favicon-upload')?.click()}
                  disabled={uploading === 'favicon'}
                  className="w-full sm:w-auto"
                  style={{ minHeight: '44px' }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading === 'favicon' ? 'Enviando...' : 'Escolher Favicon'}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Recomendado: 32x32px ou 64x64px, PNG. Máx: 100KB
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Cores da Loja
          </CardTitle>
          <CardDescription>Defina a paleta de cores do seu site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cor_primaria" className="text-sm font-medium mb-2 block">
                Cor Primária
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="cor_primaria"
                  value={loja.cor_primaria}
                  onChange={(e) => onChange('cor_primaria', e.target.value)}
                  className="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
                />
                <Input
                  value={loja.cor_primaria}
                  onChange={(e) => onChange('cor_primaria', e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Cor principal dos botões e destaques</p>
            </div>

            <div>
              <Label htmlFor="cor_secundaria" className="text-sm font-medium mb-2 block">
                Cor Secundária
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="cor_secundaria"
                  value={loja.cor_secundaria}
                  onChange={(e) => onChange('cor_secundaria', e.target.value)}
                  className="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
                />
                <Input
                  value={loja.cor_secundaria}
                  onChange={(e) => onChange('cor_secundaria', e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Cor secundária para variações</p>
            </div>

            <div>
              <Label htmlFor="cor_botao" className="text-sm font-medium mb-2 block">
                Cor do Botão
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="cor_botao"
                  value={loja.cor_botao}
                  onChange={(e) => onChange('cor_botao', e.target.value)}
                  className="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
                />
                <Input
                  value={loja.cor_botao}
                  onChange={(e) => onChange('cor_botao', e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cor_botao_hover" className="text-sm font-medium mb-2 block">
                Cor do Botão (Hover)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="cor_botao_hover"
                  value={loja.cor_botao_hover}
                  onChange={(e) => onChange('cor_botao_hover', e.target.value)}
                  className="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
                />
                <Input
                  value={loja.cor_botao_hover}
                  onChange={(e) => onChange('cor_botao_hover', e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cor_fundo" className="text-sm font-medium mb-2 block">
                Cor de Fundo
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="cor_fundo"
                  value={loja.cor_fundo}
                  onChange={(e) => onChange('cor_fundo', e.target.value)}
                  className="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
                />
                <Input
                  value={loja.cor_fundo}
                  onChange={(e) => onChange('cor_fundo', e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cor_texto" className="text-sm font-medium mb-2 block">
                Cor do Texto
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="cor_texto"
                  value={loja.cor_texto}
                  onChange={(e) => onChange('cor_texto', e.target.value)}
                  className="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
                />
                <Input
                  value={loja.cor_texto}
                  onChange={(e) => onChange('cor_texto', e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fontes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tipografia</CardTitle>
          <CardDescription>Fontes utilizadas no site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fonte_principal" className="text-sm font-medium mb-2 block">
                Fonte Principal
              </Label>
              <Input
                id="fonte_principal"
                value={loja.fonte_principal}
                onChange={(e) => onChange('fonte_principal', e.target.value)}
                placeholder="Ex: Inter, Roboto, Arial"
              />
              <p className="text-xs text-gray-500 mt-1">Fonte para títulos e destaques</p>
            </div>

            <div>
              <Label htmlFor="fonte_secundaria" className="text-sm font-medium mb-2 block">
                Fonte Secundária
              </Label>
              <Input
                id="fonte_secundaria"
                value={loja.fonte_secundaria}
                onChange={(e) => onChange('fonte_secundaria', e.target.value)}
                placeholder="Ex: Open Sans, Lato, Helvetica"
              />
              <p className="text-xs text-gray-500 mt-1">Fonte para textos corridos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
