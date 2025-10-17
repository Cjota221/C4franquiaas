import { useEffect } from 'react';
import { useProdutoStore } from '@/lib/store/produtoStore';

export function useProductFilters() {
  const store = useProdutoStore();

  useEffect(() => {
    let arr = store.produtos.slice();

    if (store.selectedCategoryFilter !== null) {
      arr = arr.filter((p) =>
        Array.isArray(p.categorias) && p.categorias.some((c) => Number(c.id) === store.selectedCategoryFilter)
      );
    }

    switch (store.sortBy) {
      case 'price_desc':
        arr.sort((a, b) => (b.preco_base ?? 0) - (a.preco_base ?? 0));
        break;
      case 'price_asc':
        arr.sort((a, b) => (a.preco_base ?? 0) - (b.preco_base ?? 0));
        break;
      case 'date_new':
        arr.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        break;
      case 'date_old':
        arr.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
        break;
      default:
        break;
    }

    store.setVisibleProdutos(arr);
  }, [store.produtos, store.selectedCategoryFilter, store.sortBy]);

  return {
    produtos: store.visibleProdutos,
    selectedCount: store.getSelectedCount(),
    categoria: store.selectedCategoryFilter,
    setCategoria: store.setSelectedCategoryFilter,
    sortBy: store.sortBy,
    setSortBy: store.setSortBy,
  };
}
