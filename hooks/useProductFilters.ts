import { useEffect } from 'react';
import { useProdutoStore } from '@/lib/store/produtoStore';

export function useProductFilters() {
  const produtos = useProdutoStore((s) => s.produtos);
  const selectedCategoryFilter = useProdutoStore((s) => s.selectedCategoryFilter);
  const sortBy = useProdutoStore((s) => s.sortBy);
  const setVisibleProdutos = useProdutoStore((s) => s.setVisibleProdutos);
  const visibleProdutos = useProdutoStore((s) => s.visibleProdutos);
  const getSelectedCount = useProdutoStore((s) => s.getSelectedCount);
  const setSelectedCategoryFilter = useProdutoStore((s) => s.setSelectedCategoryFilter);
  const setSortBy = useProdutoStore((s) => s.setSortBy);

  useEffect(() => {
    let arr = produtos.slice();

    if (selectedCategoryFilter !== null) {
      arr = arr.filter((p) =>
        Array.isArray(p.categorias) && p.categorias.some((c) => Number(c.id) === selectedCategoryFilter)
      );
    }

    switch (sortBy) {
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

    setVisibleProdutos(arr);
  }, [produtos, selectedCategoryFilter, sortBy, setVisibleProdutos]);

  return {
    produtos: visibleProdutos,
    selectedCount: getSelectedCount(),
    categoria: selectedCategoryFilter,
    setCategoria: setSelectedCategoryFilter,
    sortBy,
    setSortBy,
  };
}
