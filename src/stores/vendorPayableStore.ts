import { create } from 'zustand';
import type { VendorPayable, VendorPayment, PayableStatus, PaymentMethod } from '@/types';
import { generateId, getTodayISO } from '@/lib/formatters';

interface VendorPayableState {
  payables: VendorPayable[];
  payments: VendorPayment[];
  
  // Payable actions
  addPayable: (payable: Omit<VendorPayable, 'id' | 'paidAmount' | 'remainingAmount' | 'status'>) => string;
  
  // Payment actions
  addPayment: (vendorId: string, payableId: string, amount: number, method: PaymentMethod, notes: string, date?: string) => boolean;
  
  // Getters
  getPayablesByVendor: (vendorId: string) => VendorPayable[];
  getPaymentsByVendor: (vendorId: string) => VendorPayment[];
  getPaymentsByPayable: (payableId: string) => VendorPayment[];
  getTotalPendingPayables: () => number;
  getOverduePayables: () => VendorPayable[];
  getUpcomingPayables: (days: number) => VendorPayable[];
  getPayableStatus: (payable: VendorPayable) => PayableStatus;
}

const calculateStatus = (payable: VendorPayable): PayableStatus => {
  if (payable.remainingAmount <= 0) return 'Paid';
  
  const today = new Date();
  const dueDate = new Date(payable.dueDate);
  
  if (dueDate < today) return 'Overdue';
  if (payable.paidAmount > 0) return 'Partially Paid';
  return 'Pending';
};

export const useVendorPayableStore = create<VendorPayableState>((set, get) => ({
  payables: [],
  payments: [],

  addPayable: (payableData) => {
    const id = generateId('VP');
    const payable: VendorPayable = {
      ...payableData,
      id,
      paidAmount: 0,
      remainingAmount: payableData.totalAmount,
      status: 'Pending',
    };
    set((s) => ({ payables: [...s.payables, payable] }));
    return id;
  },

  addPayment: (vendorId, payableId, amount, method, notes, date) => {
    const payable = get().payables.find(p => p.id === payableId);
    if (!payable) return false;
    if (amount > payable.remainingAmount) return false;

    const paymentId = generateId('VPY');
    const payment: VendorPayment = {
      id: paymentId,
      vendorId,
      payableId,
      date: date || getTodayISO(),
      amount,
      method,
      notes,
    };

    set((s) => {
      const updatedPayables = s.payables.map(p => {
        if (p.id === payableId) {
          const newPaidAmount = p.paidAmount + amount;
          const newRemainingAmount = p.totalAmount - newPaidAmount;
          const updatedPayable = {
            ...p,
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
          };
          updatedPayable.status = calculateStatus(updatedPayable);
          return updatedPayable;
        }
        return p;
      });

      return {
        payables: updatedPayables,
        payments: [...s.payments, payment],
      };
    });

    return true;
  },

  getPayablesByVendor: (vendorId) => {
    return get().payables.filter(p => p.vendorId === vendorId);
  },

  getPaymentsByVendor: (vendorId) => {
    return get().payments.filter(p => p.vendorId === vendorId);
  },

  getPaymentsByPayable: (payableId) => {
    return get().payments.filter(p => p.payableId === payableId);
  },

  getTotalPendingPayables: () => {
    return get().payables.reduce((sum, p) => sum + p.remainingAmount, 0);
  },

  getOverduePayables: () => {
    const today = getTodayISO();
    return get().payables.filter(p => {
      return p.remainingAmount > 0 && p.dueDate < today;
    });
  },

  getUpcomingPayables: (days) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    const todayStr = getTodayISO();

    return get().payables.filter(p => {
      return p.remainingAmount > 0 && p.dueDate >= todayStr && p.dueDate <= futureDateStr;
    });
  },

  getPayableStatus: (payable) => {
    return calculateStatus(payable);
  },
}));
