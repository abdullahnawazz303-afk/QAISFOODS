import { create } from 'zustand';
import type { InventoryBatch } from '@/types';
import { generateId } from '@/lib/formatters';

interface InventoryState {
  batches: InventoryBatch[];
  addBatch: (b: Omit<InventoryBatch, 'id' | 'batchRef' | 'remainingQuantity'>) => string;
  deductFromBatch: (batchId: string, qty: number) => boolean;
  getTotalStockValue: () => number;
  getLowStockBatches: () => InventoryBatch[];
  getUniqueItemCount: () => number;
}

let batchCounter = 0;

const makeBatchRef = (date: string): string => {
  batchCounter++;
  const d = date.replace(/-/g, '');
  return `BT-${d}-${String(batchCounter).padStart(4, '0')}`;
};

export const useInventoryStore = create<InventoryState>((set, get) => ({
  batches: [],

  addBatch: (b) => {
    const id = generateId('INV');
    const batchRef = makeBatchRef(b.purchaseDate);
    const batch: InventoryBatch = { ...b, id, batchRef, remainingQuantity: b.quantity };
    set((s) => ({ batches: [...s.batches, batch] }));
    return id;
  },

  deductFromBatch: (batchId, qty) => {
    const batch = get().batches.find(b => b.id === batchId);
    if (!batch || batch.remainingQuantity < qty) return false;
    set((s) => ({
      batches: s.batches.map(b =>
        b.id === batchId ? { ...b, remainingQuantity: b.remainingQuantity - qty } : b
      ),
    }));
    return true;
  },

  getTotalStockValue: () => {
    return get().batches.reduce((sum, b) => sum + b.remainingQuantity * b.purchasePrice, 0);
  },

  getLowStockBatches: () => {
    return get().batches.filter(b => b.remainingQuantity > 0 && b.remainingQuantity < 100);
  },

  getUniqueItemCount: () => {
    return new Set(get().batches.filter(b => b.remainingQuantity > 0).map(b => b.itemName)).size;
  },
}));
