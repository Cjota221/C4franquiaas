import { create } from 'zustand';

type Categoria = { id?: number; nome: string };

type CategoriaStore = {
  categories: Categoria[];
  categoriaPanelOpen: boolean;
  selectedCategoryId: number | null;
  categoriaNome: string;
  editingCategoriaId: number | null;
  editingCategoriaNome: string;

  setCategories: (cats: Categoria[]) => void;
  setCategoryPanelOpen: (open: boolean) => void;
  setSelectedCategoryId: (id: number | null) => void;
  setCategoriaNome: (nome: string) => void;
  setEditingCategoriaId: (id: number | null) => void;
  setEditingCategoriaNome: (nome: string) => void;
  clearCategoriaNome: () => void;
  clearEditingCategoria: () => void;
};

export const useCategoriaStore = create<CategoriaStore>((set) => ({
  categories: [],
  categoriaPanelOpen: false,
  selectedCategoryId: null,
  categoriaNome: '',
  editingCategoriaId: null,
  editingCategoriaNome: '',

  setCategories: (categories) => set({ categories }),
  setCategoryPanelOpen: (categoriaPanelOpen) => set({ categoriaPanelOpen }),
  setSelectedCategoryId: (selectedCategoryId) => set({ selectedCategoryId }),
  setCategoriaNome: (categoriaNome) => set({ categoriaNome }),
  setEditingCategoriaId: (editingCategoriaId) => set({ editingCategoriaId }),
  setEditingCategoriaNome: (editingCategoriaNome) => set({ editingCategoriaNome }),
  clearCategoriaNome: () => set({ categoriaNome: '' }),
  clearEditingCategoria: () => set({ editingCategoriaId: null, editingCategoriaNome: '' }),
}));
