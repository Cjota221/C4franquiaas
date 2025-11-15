"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';

type Banner = {
  id: string;
  tipo: string;
  titulo: string;
  imagem: string;
  link: string;
  ativo: boolean;
  ordem: number;
};

export default function CustomizacoesPaginaInicial() {
  const supabase = createClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [lojaId, setLojaId] = useState<string | null>(null);

  const carregarBanners = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: franqueada } = await supabase
        .from('franqueadas')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!franqueada) return;

      const { data: loja } = await supabase
        .from('lojas')
        .select('id')
        .eq('franqueada_id', franqueada.id)
        .single();

      if (loja) {
        setLojaId(loja.id);

        const { data: bannersData } = await supabase
          .from('banners')
          .select('*')
          .eq('loja_id', loja.id)
          .order('ordem');

        setBanners(bannersData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
    }
  }, [supabase]);

  useEffect(() => {
    carregarBanners();
  }, [carregarBanners]);

  async function adicionarBanner(tipo: string) {
    if (!lojaId) return;

    const novoBanner = {
      loja_id: lojaId,
      tipo,
      titulo: `Banner ${tipo}`,
      imagem: 'https://via.placeholder.com/1920x720',
      link: '',
      ordem: banners.filter(b => b.tipo === tipo).length,
      ativo: true,
    };

    try {
      const { data, error } = await supabase
        .from('banners')
        .insert(novoBanner)
        .select()
        .single();

      if (error) throw error;

      setBanners([...banners, data]);
      toast.success('Banner adicionado!');
    } catch (error) {
      console.error('Erro ao adicionar banner:', error);
      toast.error('Erro ao adicionar banner');
    }
  }

  async function removerBanner(id: string) {
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBanners(banners.filter(b => b.id !== id));
      toast.success('Banner removido!');
    } catch (error) {
      console.error('Erro ao remover banner:', error);
      toast.error('Erro ao remover banner');
    }
  }

  async function atualizarBanner(id: string, campo: string, valor: string | boolean) {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ [campo]: valor })
        .eq('id', id);

      if (error) throw error;

      setBanners(banners.map(b => b.id === id ? { ...b, [campo]: valor } : b));
    } catch (error) {
      console.error('Erro ao atualizar banner:', error);
      toast.error('Erro ao atualizar banner');
    }
  }

  const bannersPorTipo = (tipo: string) => banners.filter(b => b.tipo === tipo);

  const renderBannerCard = (banner: Banner) => (
    <div key={banner.id} className="border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>TÃ­tulo</Label>
              <Input
                value={banner.titulo}
                onChange={(e) => atualizarBanner(banner.id, 'titulo', e.target.value)}
                placeholder="TÃ­tulo do banner"
              />
            </div>
            <div className="space-y-2">
              <Label>Link (opcional)</Label>
              <Input
                value={banner.link || ''}
                onChange={(e) => atualizarBanner(banner.id, 'link', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL da Imagem</Label>
            <Input
              value={banner.imagem}
              onChange={(e) => atualizarBanner(banner.id, 'imagem', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={banner.ativo}
                onCheckedChange={(checked) => atualizarBanner(banner.id, 'ativo', checked)}
              />
              <Label>Ativo</Label>
            </div>
          </div>
        </div>

        <Button variant="destructive" size="sm" onClick={() => removerBanner(banner.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {banner.imagem && (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
          <Image src={banner.imagem} alt={banner.titulo} fill className="object-cover" />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Banner Hero */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Banner Hero (Principal)</CardTitle>
              <CardDescription>Banner principal da pÃ¡gina inicial (1920x720px recomendado)</CardDescription>
            </div>
            <Button onClick={() => adicionarBanner('hero')} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {bannersPorTipo('hero').length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum banner cadastrado</p>
          ) : (
            bannersPorTipo('hero').map(renderBannerCard)
          )}
        </CardContent>
      </Card>

      {/* Banner SecundÃ¡rio */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Banner SecundÃ¡rio</CardTitle>
              <CardDescription>Banner no meio da pÃ¡gina inicial (1200x250px recomendado)</CardDescription>
            </div>
            <Button onClick={() => adicionarBanner('secundario')} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {bannersPorTipo('secundario').length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum banner cadastrado</p>
          ) : (
            bannersPorTipo('secundario').map(renderBannerCard)
          )}
        </CardContent>
      </Card>

      {/* Banner Mobile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Banner Mobile</CardTitle>
              <CardDescription>Banner especÃ­fico para dispositivos mÃ³veis (800x600px recomendado)</CardDescription>
            </div>
            <Button onClick={() => adicionarBanner('mobile')} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {bannersPorTipo('mobile').length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum banner cadastrado</p>
          ) : (
            bannersPorTipo('mobile').map(renderBannerCard)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
