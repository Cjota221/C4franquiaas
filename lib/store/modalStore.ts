import { create } from 'zustand';

type Produto = {
  id: number;
  nome: string;
  [k: string]: unknown;
};

type Variacao = {
  id?: string | number;
  sku?: string | null;
  codigo_de_barras?: string | null;
  estoque?: number | null;
  preco?: number | null;
  [k: string]: unknown;
};

type ModalStore = {
  modalOpen: boolean;
  modalProduto: Produto | null;
  modalVariacoes: Variacao[] | null;
  modalLoading: boolean;

  priceModalOpen: boolean;

  openModal: (produto: Produto) => void;
  closeModal: () => void;
  setModalVariacoes: (vars: Variacao[] | null) => void;
  setModalLoading: (loading: boolean) => void;

  openPriceModal: () => void;
  closePriceModal: () => void;
};

export const useModalStore = create<ModalStore>((set) => ({
  modalOpen: false,
  modalProduto: null,
  modalVariacoes: null,
  modalLoading: false,

  priceModalOpen: false,

  openModal: (modalProduto) => set({ modalOpen: true, modalProduto }),
  closeModal: () => set({ modalOpen: false, modalProduto: null, modalVariacoes: null }),
  setModalVariacoes: (modalVariacoes) => set({ modalVariacoes }),
  setModalLoading: (modalLoading) => set({ modalLoading }),

  openPriceModal: () => set({ priceModalOpen: true }),
  closePriceModal: () => set({ priceModalOpen: false }),
}));
