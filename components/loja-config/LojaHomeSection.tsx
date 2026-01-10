"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Upload, Image as ImageIcon, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Banner {
  id: string;
  titulo: string;
  imagem: string;
  link: string;
  ativo: boolean;
  ordem: number;
}

interface LojaHomeProps {
  loja: {
    banner_hero: string | null;
    texto_hero: string | null;
    subtexto_hero: string | null;
    descricao: string | null;
    slogan: string | null;
  };
  banners: Banner[];
  onChange: (field: string, value: string) => void;
  onUpload: (field: string, file: File) => Promise<void>;
  onBannerAdd: () => void;
  onBannerUpdate: (id: string, field: string, value: string | boolean | number) => void;
  onBannerDelete: (id: string) => void;
  onBannerUpload: (id: string, file: File) => Promise<void>;
}

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB para banners
const MAX_BANNERS = 5;

export default function LojaHomeSection({
  loja,
  banners,
  onChange,
  onUpload,
  onBannerAdd,
  onBannerUpdate,
  onBannerDelete,
  onBannerUpload
}: LojaHomeProps) {
  const [uploadingBanner, setUploadingBanner] = useState<string | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);

  const handleHeroUpload = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Imagem muito grande. Máximo 3MB');
      return;
    }

    setUploadingHero(true);
    try {
      await onUpload('banner_hero', file);
      toast.success('Banner Hero atualizado!');
    } catch (error) {
      toast.error('Erro ao enviar banner');
    } finally {
      setUploadingHero(false);
    }
  };

  const handleBannerFileUpload = async (bannerId: string, file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Imagem muito grande. Máximo 3MB');
      return;
    }

    setUploadingBanner(bannerId);
    try {
      await onBannerUpload(bannerId, file);
      toast.success('Banner atualizado!');
    } catch (error) {
      toast.error('Erro ao enviar banner');
    } finally {
      setUploadingBanner(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Seção Hero (Topo da Página)
          </CardTitle>
          <CardDescription>
            Banner principal e textos de destaque que aparecem no topo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Banner Hero */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Banner de Fundo</Label>
            {loja.banner_hero && (
              <div className="mb-3 rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={loja.banner_hero}
                  alt="Banner Hero"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
            <input
              type="file"
              id="hero-upload"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleHeroUpload(file);
              }}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('hero-upload')?.click()}
              disabled={uploadingHero}
              className="w-full sm:w-auto"
              style={{ minHeight: '44px' }}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadingHero ? 'Enviando...' : 'Escolher Banner'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Recomendado: 1920x600px, JPG ou PNG. Máx: 3MB
            </p>
          </div>

          {/* Textos Hero */}
          <div>
            <Label htmlFor="texto_hero" className="text-sm font-medium mb-2 block">
              Título Principal
            </Label>
            <Input
              id="texto_hero"
              value={loja.texto_hero || ''}
              onChange={(e) => onChange('texto_hero', e.target.value)}
              placeholder="Ex: Bem-vindo à nossa loja!"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Título grande que aparece sobre o banner</p>
          </div>

          <div>
            <Label htmlFor="subtexto_hero" className="text-sm font-medium mb-2 block">
              Subtítulo
            </Label>
            <Input
              id="subtexto_hero"
              value={loja.subtexto_hero || ''}
              onChange={(e) => onChange('subtexto_hero', e.target.value)}
              placeholder="Ex: Produtos de qualidade com os melhores preços"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Texto menor abaixo do título</p>
          </div>
        </CardContent>
      </Card>

      {/* Sobre a Loja */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sobre a Loja</CardTitle>
          <CardDescription>Informações que aparecem na página inicial</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="slogan" className="text-sm font-medium mb-2 block">
              Slogan
            </Label>
            <Input
              id="slogan"
              value={loja.slogan || ''}
              onChange={(e) => onChange('slogan', e.target.value)}
              placeholder="Ex: Qualidade que você confia"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Frase curta sobre sua loja</p>
          </div>

          <div>
            <Label htmlFor="descricao" className="text-sm font-medium mb-2 block">
              Descrição da Loja
            </Label>
            <Textarea
              id="descricao"
              value={loja.descricao || ''}
              onChange={(e) => onChange('descricao', e.target.value)}
              placeholder="Conte um pouco sobre sua loja, produtos e diferenciais..."
              rows={4}
              className="w-full resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Texto que aparece na seção &ldquo;Sobre&rdquo; da página inicial
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Banners Adicionais */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Banners Promocionais</CardTitle>
              <CardDescription>
                Banners extras para promoções, categorias, etc. (Máximo {MAX_BANNERS})
              </CardDescription>
            </div>
            {banners.length < MAX_BANNERS && (
              <Button
                type="button"
                onClick={onBannerAdd}
                size="sm"
                className="shrink-0"
                style={{ minHeight: '40px' }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum banner adicionado ainda</p>
              <p className="text-xs mt-1">Clique em &ldquo;Adicionar&rdquo; para criar um banner</p>
            </div>
          ) : (
            <div className="space-y-4">
              {banners
                .sort((a, b) => a.ordem - b.ordem)
                .map((banner) => (
                  <div
                    key={banner.id}
                    className="border-2 border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    {/* Header do Banner */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">Banner #{banner.ordem}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={banner.ativo}
                            onCheckedChange={(checked) =>
                              onBannerUpdate(banner.id, 'ativo', checked)
                            }
                          />
                          <span className="text-xs text-gray-600">
                            {banner.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onBannerDelete(banner.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Imagem do Banner */}
                    {banner.imagem && (
                      <div className="rounded overflow-hidden border border-gray-200">
                        <img
                          src={banner.imagem}
                          alt={banner.titulo}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}

                    {/* Upload */}
                    <div>
                      <input
                        type="file"
                        id={`banner-upload-${banner.id}`}
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleBannerFileUpload(banner.id, file);
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById(`banner-upload-${banner.id}`)?.click()
                        }
                        disabled={uploadingBanner === banner.id}
                        className="w-full"
                        style={{ minHeight: '40px' }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingBanner === banner.id
                          ? 'Enviando...'
                          : banner.imagem
                          ? 'Trocar Imagem'
                          : 'Escolher Imagem'}
                      </Button>
                    </div>

                    {/* Título */}
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Título</Label>
                      <Input
                        value={banner.titulo}
                        onChange={(e) => onBannerUpdate(banner.id, 'titulo', e.target.value)}
                        placeholder="Ex: Promoção de Verão"
                        className="w-full text-sm"
                      />
                    </div>

                    {/* Link */}
                    <div>
                      <Label className="text-xs font-medium mb-1 block">
                        Link (opcional)
                      </Label>
                      <Input
                        value={banner.link}
                        onChange={(e) => onBannerUpdate(banner.id, 'link', e.target.value)}
                        placeholder="/categoria/verao"
                        className="w-full text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Para onde o banner leva ao clicar
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
