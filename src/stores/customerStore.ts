import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { Customer, LedgerEntry } from '@/types';

interface CustomerState {
  customers: Customer[];
  ledgerEntries: Record<string, LedgerEntry[]>;
  loading: boolean;
  error: string | null;

  fetchCustomers: () => Promise<void>;
  fetchLedger: (customerId: string) => Promise<void>;
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => Promise<string | null>;
  addLedgerEntry: (customerId: string, entry: Omit<LedgerEntry, 'id' | 'balance'>) => Promise<void>;
  getOutstanding: (customerId: string) => number;
  getTotalReceivables: () => number;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  ledgerEntries: {},
  loading: false,
  error: null,

  // ── Fetch all customers
  fetchCustomers: async () => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    const customers: Customer[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      contactPerson: row.contact_person ?? '',
      phone: row.phone ?? '',
      city: row.city ?? '',
      address: row.address ?? '',
      openingBalance: row.opening_balance ?? 0,
      creditLimit: row.credit_limit ?? 0,
      notes: row.notes ?? '',
      isActive: row.is_active,
      createdAt: row.created_at,
    }));

    set({ customers, loading: false });
  },

  // ── Fetch ledger for a specific customer
  fetchLedger: async (customerId: string) => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('customer_ledger')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    const entries: LedgerEntry[] = (data || []).map((row: any) => ({
      id: row.id,
      date: row.entry_date,
      type: row.transaction_type,
      description: row.description ?? '',
      debit: row.debit ?? 0,
      credit: row.credit ?? 0,
      balance: row.running_balance ?? 0,
    }));

    set((s) => ({
      ledgerEntries: { ...s.ledgerEntries, [customerId]: entries },
      loading: false,
    }));
  },

  // ── Add a new customer
  addCustomer: async (c) => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: c.name,
        contact_person: c.contactPerson ?? null,
        phone: c.phone ?? null,
        city: c.city ?? null,
        address: c.address ?? null,
        opening_balance: c.openingBalance ?? 0,
        credit_limit: c.creditLimit ?? 0,
        notes: c.notes ?? null,
        is_active: c.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      set({ error: error.message, loading: false });
      return null;
    }

    // Seed opening balance into ledger if exists
    if (c.openingBalance && c.openingBalance > 0) {
      await supabase.from('customer_ledger').insert({
        customer_id: data.id,
        entry_date: new Date().toISOString().split('T')[0],
        transaction_type: 'Opening Balance',
        description: 'Opening balance at time of registration',
        debit: c.openingBalance,
        credit: 0,
        running_balance: c.openingBalance,
      });
    }

    await get().fetchCustomers();
    return data.id;
  },

  // ── Add a ledger entry manually (payment received, adjustment)
  addLedgerEntry: async (customerId, entry) => {
    const existing = get().ledgerEntries[customerId] || [];
    const lastBalance =
      existing.length > 0 ? existing[existing.length - 1].balance : 0;
    const newBalance = lastBalance + entry.debit - entry.credit;

    const { error } = await supabase.from('customer_ledger').insert({
      customer_id: customerId,
      entry_date: entry.date,
      transaction_type: entry.type,
      description: entry.description ?? null,
      debit: entry.debit ?? 0,
      credit: entry.credit ?? 0,
      running_balance: newBalance,
    });

    if (error) {
      set({ error: error.message });
      return;
    }

    await get().fetchLedger(customerId);
  },

  // ── Get outstanding balance for a customer
  getOutstanding: (customerId) => {
    const entries = get().ledgerEntries[customerId] || [];
    if (entries.length === 0) return 0;
    return entries[entries.length - 1].balance;
  },

  // ── Get total receivables across all customers
  getTotalReceivables: () => {
    const { ledgerEntries } = get();
    let total = 0;
    for (const entries of Object.values(ledgerEntries)) {
      if (entries.length > 0) {
        const bal = entries[entries.length - 1].balance;
        if (bal > 0) total += bal;
      }
    }
    return total;
  },
}));