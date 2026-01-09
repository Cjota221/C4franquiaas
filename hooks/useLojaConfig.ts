"use client";
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface Loja {
  id: string;
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
  banner_hero: string | null;
  texto_hero: string | null;
  subtexto_hero: string | null;
  descricao: string | null;
  slogan: string | null;
  mostrar_estoque: boolean;
  mostrar_codigo_barras: boolean;
  permitir_carrinho: boolean;
  modo_catalogo: boolean;
  mensagem_whatsapp: string | null;
  telefone: string | null;
  email_contato: string | null;
  endereco: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  meta_title: string | null;
  meta_description: string | null;
  google_analytics: string | null;
  facebook_pixel: string | null;
  ativo: boolean;
}

export interface Banner {
  id: string;
  loja_id: string;
  tipo: string;
  titulo: string;
  imagem: string;
  link: string;
  ativo: boolean;
  ordem: number;
}

export function useLojaConfig() {
  const supabase = createClient();
  const [loja, setLoja] = useState<Loja | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [franqueadaId, setFranqueadaId] = useState<string | null>(null);

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { data: franqueada } = await supabase
        .from('franqueadas')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!franqueada) {
        toast.error('Franqueada não encontrada');
        return;
      }

      setFranqueadaId(franqueada.id);

      const { data: lojaData, error: lojaError } = await supabase
        .from('lojas')
        .select('*')
        .eq('franqueada_id', franqueada.id)
        .single();

      if (lojaError) throw lojaError;
      if (lojaData) setLoja(lojaData as Loja);

      // Carregar banners
      const { data: bannersData } = await supabase
        .from('banners')
        .select('*')
        .eq('loja_id', lojaData.id)
        .order('ordem');

      if (bannersData) setBanners(bannersData as Banner[]);
    } catch (error) {
      console.error('Erro ao carregar:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Atualizar campo da loja
  const updateLojaField = (field: string, value: string | boolean) => {
    if (!loja) return;
    setLoja({ ...loja, [field]: value });
  };

  // Salvar loja
  const saveLoja = async () => {
    if (!loja) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lojas')
        .update(loja)
        .eq('id', loja.id);

      if (error) throw error;
      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  // Upload de imagem
  const uploadImage = async (field: string, file: File): Promise<void> => {
    if (!loja) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${loja.id}-${field}-${Date.now()}.${fileExt}`;
      const filePath = `lojas/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('public').getPublicUrl(filePath);
      
      updateLojaField(field, data.publicUrl);
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  };

  // Gerenciar banners
  const addBanner = async () => {
    if (!loja) return;

    const newBanner: Partial<Banner> = {
      loja_id: loja.id,
      tipo: 'promocional',
      titulo: 'Novo Banner',
      imagem: '',
      link: '',
      ativo: true,
      ordem: banners.length + 1,
    };

    const { data, error } = await supabase
      .from('banners')
      .insert([newBanner])
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar banner');
      return;
    }

    if (data) {
      setBanners([...banners, data as Banner]);
      toast.success('Banner criado!');
    }
  };

  const updateBanner = (id: string, field: string, value: string | boolean) => {
    setBanners(
      banners.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const deleteBanner = async (id: string) => {
    const { error } = await supabase.from('banners').delete().eq('id', id);

    if (error) {
      toast.error('Erro ao deletar banner');
      return;
    }

    setBanners(banners.filter((b) => b.id !== id));
    toast.success('Banner removido!');
  };

  const saveBanners = async () => {
    setSaving(true);
    try {
      for (const banner of banners) {
        await supabase.from('banners').update(banner).eq('id', banner.id);
      }
      toast.success('Banners salvos!');
    } catch (err) {
      console.error('Erro ao salvar banners:', err);
      toast.error('Erro ao salvar banners');
    } finally {
      setSaving(false);
    }
  };

  const uploadBannerImage = async (bannerId: string, file: File): Promise<void> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${bannerId}-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('public').getPublicUrl(filePath);
      
      updateBanner(bannerId, 'imagem', data.publicUrl);
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  };

  return {
    loja,
    banners,
    loading,
    saving,
    franqueadaId,
    updateLojaField,
    saveLoja,
    uploadImage,
    addBanner,
    updateBanner,
    deleteBanner,
    saveBanners,
    uploadBannerImage,
  };
}
