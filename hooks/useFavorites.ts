/**
 * 💖 HOOK DE FAVORITOS
 * 
 * Gerencia favoritos do usuário com:
 * - localStorage para persistência local
 * - Supabase para sync com backend (revendedora pode ver)
 * 
 * @author C4 Franquias
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface FavoriteItem {
  id: string;
  productId: string;
visitorId: string;
  resellerId: string;
  productName: string;
  productImage?: string;
  productPrice: number;
  createdAt: string;
}

interface UseFavoritesProps {
  resellerId: string;
  slug: string;
}

// Gerar ID único para o visitante (anônimo)
function getVisitorId(slug: string): string {
  const key = `visitor_id_${slug}`;
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
}

export function useFavorites({ resellerId, slug }: UseFavoritesProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Carregar favoritos do localStorage
  useEffect(() => {
    if (!slug) return;
    
    const loadFavorites = () => {
      try {
        const key = `favorites_${slug}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const items: FavoriteItem[] = JSON.parse(stored);
          setFavoriteItems(items);
          setFavorites(new Set(items.map(item => item.productId)));
        }
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [slug]);

  // Salvar no localStorage e tentar sync com Supabase
  const saveFavorites = useCallback(async (items: FavoriteItem[]) => {
    const key = `favorites_${slug}`;
    localStorage.setItem(key, JSON.stringify(items));
    setFavoriteItems(items);
    setFavorites(new Set(items.map(item => item.productId)));

    // Tentar salvar no Supabase (fire and forget)
    try {
      const visitorId = getVisitorId(slug);
      
      // Upsert de todos os favoritos
      for (const item of items) {
        await supabase
          .from('product_favorites')
          .upsert({
            visitor_id: visitorId,
            reseller_id: resellerId,
            product_id: item.productId,
            product_name: item.productName,
            product_image: item.productImage,
            product_price: item.productPrice,
          }, {
            onConflict: 'visitor_id,product_id',
          });
      }
    } catch (error) {
      // Silently fail - localStorage é a fonte principal
      console.error('Erro ao sincronizar favoritos:', error);
    }
  }, [slug, resellerId, supabase]);

  // Adicionar favorito
  const addFavorite = useCallback((product: {
    id: string;
    nome: string;
    imagem?: string;
    preco: number;
  }) => {
    const visitorId = getVisitorId(slug);
    const newItem: FavoriteItem = {
      id: `${visitorId}_${product.id}`,
      productId: product.id,
      visitorId,
      resellerId,
      productName: product.nome,
      productImage: product.imagem,
      productPrice: product.preco,
      createdAt: new Date().toISOString(),
    };

    const updated = [...favoriteItems.filter(f => f.productId !== product.id), newItem];
    saveFavorites(updated);
    
    return true;
  }, [favoriteItems, saveFavorites, slug, resellerId]);

  // Remover favorito
  const removeFavorite = useCallback(async (productId: string) => {
    const updated = favoriteItems.filter(f => f.productId !== productId);
    saveFavorites(updated);

    // Remover do Supabase também
    try {
      const visitorId = getVisitorId(slug);
      await supabase
        .from('product_favorites')
        .delete()
        .eq('visitor_id', visitorId)
        .eq('product_id', productId);
    } catch (error) {
      console.error('Erro ao remover favorito do banco:', error);
    }

    return true;
  }, [favoriteItems, saveFavorites, slug, supabase]);

  // Toggle favorito
  const toggleFavorite = useCallback((product: {
    id: string;
    nome: string;
    imagem?: string;
    preco: number;
  }) => {
    if (favorites.has(product.id)) {
      removeFavorite(product.id);
      return false;
    } else {
      addFavorite(product);
      return true;
    }
  }, [favorites, addFavorite, removeFavorite]);

  // Verificar se é favorito
  const isFavorite = useCallback((productId: string) => {
    return favorites.has(productId);
  }, [favorites]);

  // Limpar todos os favoritos
  const clearFavorites = useCallback(async () => {
    saveFavorites([]);
    
    try {
      const visitorId = getVisitorId(slug);
      await supabase
        .from('product_favorites')
        .delete()
        .eq('visitor_id', visitorId);
    } catch (error) {
      console.error('Erro ao limpar favoritos do banco:', error);
    }
  }, [saveFavorites, slug, supabase]);

  return {
    favorites,
    favoriteItems,
    loading,
    count: favorites.size,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
}

export default useFavorites;
