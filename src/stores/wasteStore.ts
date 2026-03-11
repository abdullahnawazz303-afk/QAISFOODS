import { create } from 'zustand';
import type { WasteEntry } from '@/types';
import { generateId } from '@/lib/formatters';

interface WasteState {
  entries: WasteEntry[];
  addEntry: (e: Omit<WasteEntry, 'id'>) => string;
  getTotalWaste: () => number;
  getWasteByVendor: (vendorId: string) => WasteEntry[];
  getWasteByBatch: (batchId: string) => WasteEntry[];
}

export const useWasteStore = create<WasteState>((set, get) => ({
  entries: [],

  addEntry: (e) => {
    const id = generateId('WST');
    set((s) => ({ entries: [...s.entries, { ...e, id }] }));
    return id;
  },

  getTotalWaste: () => get().entries.reduce((s, e) => s + e.wasteQuantity, 0),

  getWasteByVendor: (vendorId) => get().entries.filter((e) => e.vendorId === vendorId),

  getWasteByBatch: (batchId) => get().entries.filter((e) => e.batchId === batchId),
}));
