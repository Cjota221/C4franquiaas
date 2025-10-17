import { create } from 'zustand';

type StatusMessage = {
  type: 'success' | 'error' | 'loading' | 'info';
  text: string;
} | null;

type StatusStore = {
  statusMsg: StatusMessage;
  toggling: Record<number, boolean>;

  setStatusMsg: (msg: StatusMessage) => void;
  setToggling: (id: number, toggling: boolean) => void;
  clearToggling: (id: number) => void;
};

export const useStatusStore = create<StatusStore>((set) => ({
  statusMsg: null,
  toggling: {},

  setStatusMsg: (statusMsg) => set({ statusMsg }),
  setToggling: (id, toggling) =>
    set((state) => ({
      toggling: {
        ...state.toggling,
        [id]: toggling,
      },
    })),
  clearToggling: (id) =>
    set((state) => {
      const newToggling = { ...state.toggling };
      delete newToggling[id];
      return { toggling: newToggling };
    }),
}));
