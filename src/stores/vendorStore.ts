import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { Vendor, LedgerEntry, VendorPurchase, VendorPayable } from '@/types';

interface VendorState {
  vendors: Vendor[];
  ledgerEntries: Record<string, LedgerEntry[]>;
  purchases: VendorPurchase[];
  bookings: any[]; // Use any to avoid circular dependencies if needed, or import AdvanceBooking
  loading: boolean;
  error: string | null;

  fetchVendors: () => Promise<void>;
  fetchLedger: (vendorId: string) => Promise<void>;
  fetchPurchases: () => Promise<void>;
  addVendor: (v: Omit<Vendor, 'id' | 'createdAt'>) => Promise<string | null>;
  editVendor: (vendorId: string, updates: {
    name: string;
    contactPerson: string;
    phone: string;
    city: string;
    address: string;
    notes: string;
    isActive: boolean;
  }) => Promise<boolean>;
  deleteVendor: (vendorId: string) => Promise<{ success: boolean; reason?: string }>;
  addLedgerEntry: (vendorId: string, entry: Omit<LedgerEntry, 'id' | 'balance'>) => Promise<void>;
  addPurchase: (p: {
    vendorId: string;
    purchaseDate: string;
    items: { itemName: string; grade: string; quantityKg: number; pricePerKg: number }[];
    totalAmount: number;
    amountPaid: number;
    paymentTermsDays: number;
    paymentMethod: string;
    notes: string;
    referenceNumber?: string;
  }) => Promise<string | null>;
  recordPayment: (purchaseId: string, vendorId: string, amount: number, method: string, notes: string, referenceNumber?: string) => Promise<void>;

  getOutstanding: (vendorId: string) => number;
  getTotalPayables: () => number;
  getPayables: () => VendorPayable[];
  getOverduePayables: () => VendorPayable[];
  getUpcomingPayables: (days: number) => VendorPayable[];
}

// ── Helper: get or create today's cash day and return its id
const getOpenCashDayId = async (): Promise<string | null> => {
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase.from('cash_days').select('id, is_closed').eq('business_date', today).maybeSingle();
  if (existing) return existing.is_closed ? null : existing.id;
  const { data: lastClosed } = await supabase.from('cash_days').select('closing_balance').eq('is_closed', true).order('business_date', { ascending: false }).limit(1).maybeSingle();
  const openingBalance = lastClosed?.closing_balance ?? 0;
  const { data: newDay, error } = await supabase.from('cash_days').insert({ business_date: today, opening_balance: openingBalance, is_closed: false }).select('id').single();
  if (error) return null;
  return newDay.id;
};

export const useVendorStore = create<VendorState>((set, get) => ({
  vendors: [],
  ledgerEntries: {},
  purchases: [],
  bookings: [],
  loading: false,
  error: null,

  // ── Fetch vendors + ALL ledgers in one go
  fetchVendors: async () => {
    set({ loading: true, error: null });

    const [
      { data: vendorData, error: vendorError },
      { data: ledgerData },
      { data: bookingData }
    ] = await Promise.all([
      supabase.from('vendors').select('*').order('name'),
      supabase.from('vendor_ledger').select('*').order('created_at', { ascending: true }),
      supabase.from('advance_bookings').select('*, booking_items(*), booking_payments(*)')
    ]);

    if (vendorError) { set({ error: vendorError.message, loading: false }); return; }

    const vendors: Vendor[] = (vendorData || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      contactPerson: row.contact_person ?? '',
      phone: row.phone ?? '',
      city: row.city ?? '',
      address: row.address ?? '',
      openingBalance: row.opening_balance ?? 0,
      notes: row.notes ?? '',
      isActive: row.is_active,
      createdAt: row.created_at,
    }));

    const ledgerEntries: Record<string, LedgerEntry[]> = {};
    for (const row of (ledgerData || [])) {
      if (!ledgerEntries[row.vendor_id]) ledgerEntries[row.vendor_id] = [];
      ledgerEntries[row.vendor_id].push({
        id: row.id,
        date: row.entry_date,
        type: row.transaction_type,
        description: row.description ?? '',
        debit: row.debit ?? 0,
        credit: row.credit ?? 0,
        balance: row.running_balance ?? 0,
      });
    }

    const bookings = (bookingData || []).map((row: any) => ({
      id: row.id,
      bookingRef: row.booking_ref ?? row.id.slice(0, 8).toUpperCase(),
      bookingDate: row.booking_date,
      vendorId: row.vendor_id,
      expectedDeliveryDate: row.expected_delivery_date,
      totalValue: row.total_value,
      advancePaid: row.advance_paid,
      remainingBalance: row.remaining_balance,
      status: row.status,
      items: (row.booking_items || []).map((i: any) => ({
        itemName: i.item_name,
        grade: i.grade,
        quantity: i.quantity_kg,
        agreedPrice: i.agreed_price_per_kg,
        subtotal: i.subtotal,
      })),
      notes: row.notes ?? '',
    }));

    set({ vendors, ledgerEntries, bookings, loading: false });
  },

  // ── Fetch single vendor ledger
  fetchLedger: async (vendorId) => {
    const { data, error } = await supabase
      .from('vendor_ledger')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: true });

    if (error) { set({ error: error.message }); return; }

    const entries: LedgerEntry[] = (data || []).map((row: any) => ({
      id: row.id,
      date: row.entry_date,
      type: row.transaction_type,
      description: row.description ?? '',
      debit: row.debit ?? 0,
      credit: row.credit ?? 0,
      balance: row.running_balance ?? 0,
    }));

    set((s) => ({ ledgerEntries: { ...s.ledgerEntries, [vendorId]: entries } }));
  },

  // ── Fetch all purchases
  fetchPurchases: async () => {
    const { data, error } = await supabase
      .from('vendor_purchases')
      .select('*, vendors(name), vendor_purchase_items(*)')
      .order('purchase_date', { ascending: false });

    if (error) { set({ error: error.message }); return; }

    const purchases: VendorPurchase[] = (data || []).map((row: any) => {
      const dueDate = row.payment_terms_days > 0
        ? new Date(new Date(row.purchase_date).getTime() + row.payment_terms_days * 86400000)
            .toISOString().split('T')[0]
        : row.purchase_date;
      return {
        id: row.id,
        purchaseRef: row.purchase_ref ?? row.id.slice(0, 8).toUpperCase(),
        vendorId: row.vendor_id,
        vendorName: row.vendors?.name ?? '',
        purchaseDate: row.purchase_date,
        totalAmount: row.total_amount,
        amountPaid: row.amount_paid ?? 0,
        outstanding: row.total_amount - (row.amount_paid ?? 0),
        paymentTermsDays: row.payment_terms_days ?? 0,
        dueDate,
        paymentMethod: row.payment_method ?? 'Cash',
        paymentStatus: row.payment_status,
        items: (row.vendor_purchase_items || []).map((i: any) => ({
          id: i.id,
          itemName: i.item_name,
          grade: i.grade,
          quantityKg: i.quantity_kg,
          pricePerKg: i.price_per_kg,
          subtotal: i.subtotal,
        })),
        notes: row.notes ?? '',
        createdAt: row.created_at,
      };
    });

    set({ purchases });
  },

  // ── Add vendor
  addVendor: async (v) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('vendors')
      .insert({
        name: v.name,
        contact_person: v.contactPerson ?? null,
        phone: v.phone ?? null,
        city: v.city ?? null,
        address: v.address ?? null,
        opening_balance: v.openingBalance ?? 0,
        notes: v.notes ?? null,
        is_active: v.isActive ?? true,
      })
      .select().single();

    if (error) { set({ error: error.message, loading: false }); return null; }

    if (v.openingBalance && v.openingBalance > 0) {
      await supabase.from('vendor_ledger').insert({
        vendor_id: data.id,
        entry_date: new Date().toISOString().split('T')[0],
        transaction_type: 'Opening Balance',
        description: 'Opening balance at registration',
        debit: 0,
        credit: v.openingBalance,
        running_balance: v.openingBalance,
      });
    }

    await get().fetchVendors();
    return data.id;
  },

  // ── Edit vendor profile — no financial impact
  editVendor: async (vendorId, updates) => {
    const { error } = await supabase
      .from('vendors')
      .update({
        name: updates.name,
        contact_person: updates.contactPerson || null,
        phone: updates.phone || null,
        city: updates.city || null,
        address: updates.address || null,
        notes: updates.notes || null,
        is_active: updates.isActive,
      })
      .eq('id', vendorId);

    if (error) { set({ error: error.message }); return false; }

    // Update local state immediately
    set((s) => ({
      vendors: s.vendors.map((v) =>
        v.id === vendorId
          ? {
              ...v,
              name: updates.name,
              contactPerson: updates.contactPerson,
              phone: updates.phone,
              city: updates.city,
              address: updates.address,
              notes: updates.notes,
              isActive: updates.isActive,
            }
          : v
      ),
    }));

    return true;
  },

  // ── Delete vendor — blocked if any purchases, ledger entries, or inventory batches exist
  deleteVendor: async (vendorId) => {
    // Check vendor_purchases
    const { count: purchaseCount } = await supabase
      .from('vendor_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    if (purchaseCount && purchaseCount > 0) {
      return {
        success: false,
        reason: `This vendor has ${purchaseCount} purchase record${purchaseCount > 1 ? 's' : ''}. Cannot delete a vendor with purchase history.`,
      };
    }

    // Check inventory_batches
    const { count: batchCount } = await supabase
      .from('inventory_batches')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    if (batchCount && batchCount > 0) {
      return {
        success: false,
        reason: `This vendor has ${batchCount} inventory batch${batchCount > 1 ? 'es' : ''}. Cannot delete a vendor with inventory history.`,
      };
    }

    // Check vendor_ledger (beyond opening balance)
    const { count: ledgerCount } = await supabase
      .from('vendor_ledger')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .neq('transaction_type', 'Opening Balance');

    if (ledgerCount && ledgerCount > 0) {
      return {
        success: false,
        reason: `This vendor has ledger transaction history. Cannot delete.`,
      };
    }

    // Safe to delete
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendorId);

    if (error) return { success: false, reason: error.message };

    set((s) => ({
      vendors: s.vendors.filter((v) => v.id !== vendorId),
      ledgerEntries: Object.fromEntries(
        Object.entries(s.ledgerEntries).filter(([id]) => id !== vendorId)
      ),
    }));

    return { success: true };
  },

  // ── Add ledger entry — always fetch last balance from DB, never local state
  addLedgerEntry: async (vendorId, entry) => {
    const { data: lastRow } = await supabase
      .from('vendor_ledger')
      .select('running_balance')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastBalance = lastRow?.running_balance ?? 0;
    const newBalance = lastBalance + entry.credit - entry.debit;

    const { error } = await supabase.from('vendor_ledger').insert({
      vendor_id: vendorId,
      entry_date: entry.date,
      transaction_type: entry.type,
      description: entry.description ?? null,
      debit: entry.debit ?? 0,
      credit: entry.credit ?? 0,
      running_balance: newBalance,
    });

    if (error) { set({ error: error.message }); return; }
    await get().fetchLedger(vendorId);
  },

  // ── Add purchase
  addPurchase: async (p) => {
    const outstanding = p.totalAmount - p.amountPaid;
    const paymentStatus = outstanding <= 0 ? 'Paid' : p.amountPaid > 0 ? 'Partially Paid' : 'Unpaid';

    const { data, error } = await supabase
      .from('vendor_purchases')
      .insert({
        vendor_id: p.vendorId,
        purchase_date: p.purchaseDate,
        total_amount: p.totalAmount,
        amount_paid: p.amountPaid,
        payment_terms_days: p.paymentTermsDays,
        payment_method: p.paymentMethod,
        payment_status: paymentStatus,
        notes: p.notes ?? null,
      })
      .select().single();

    if (error) { set({ error: error.message }); return null; }

    await supabase.from('vendor_purchase_items').insert(
      p.items.map(i => ({
        purchase_id: data.id,
        item_name: i.itemName,
        grade: i.grade,
        quantity_kg: i.quantityKg,
        price_per_kg: i.pricePerKg,
      }))
    );

    await get().addLedgerEntry(p.vendorId, {
      date: p.purchaseDate,
      type: 'Purchase',
      description: `Purchase: ${p.items.map(i => i.itemName).join(', ')}`,
      debit: 0,
      credit: p.totalAmount,
    });

    if (p.amountPaid > 0) {
      await get().addLedgerEntry(p.vendorId, {
        date: p.purchaseDate,
        type: 'Payment Made',
        description: `Upfront payment at purchase`,
        debit: p.amountPaid,
        credit: 0,
      });

      // Log upfront payment into vendor_payments for tracing during deletion
      await supabase.from('vendor_payments').insert({
        vendor_id: p.vendorId,
        amount: p.amountPaid,
        payment_date: p.purchaseDate,
        payment_method: p.paymentMethod || 'Cash',
        notes: p.notes || `Upfront payment (${p.paymentMethod || 'Cash'})`,
        reference_id: data.id,
        reference_type: 'purchase',
        reference_number: p.referenceNumber || null
      });

      const isBankOrCheque = p.paymentMethod === 'Bank Transfer' || p.paymentMethod === 'Cheque';

      if (isBankOrCheque) {
        const chequeNumber = p.referenceNumber || `BTC-${Date.now().toString().slice(-6)}`;
        await supabase.from('cheques').insert({
          cheque_number: chequeNumber,
          vendor_id: p.vendorId,
          amount: p.amountPaid,
          issue_date: p.purchaseDate,
          expected_clearance_date: p.purchaseDate,
          bank_name: p.paymentMethod === 'Bank Transfer' ? 'Bank Transfer' : 'Vendor Cheque',
          status: 'Cleared',
          notes: `Upfront payment for purchase — ${p.notes || ''}`,
          reference_id: data.id,
          reference_type: 'VENDOR_PURCHASE'
        });
      } else {
        const cashDayId = await getOpenCashDayId();
        if (cashDayId) {
          await supabase.from('cash_entries').insert({
            cash_day_id: cashDayId,
            entry_type: 'out',
            category: 'Vendor Payment',
            amount: p.amountPaid,
            description: `Upfront payment for purchase`,
            reference_id: data.id,
            reference_type: 'VENDOR_PURCHASE'
          });
        }
      }
    }

    await get().fetchPurchases();
    return data.id;
  },

  // ── Record payment against a purchase
  recordPayment: async (purchaseId, vendorId, amount, method, notes, referenceNumber) => {
    const purchase = get().purchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    const newPaid = purchase.amountPaid + amount;
    const newOutstanding = purchase.totalAmount - newPaid;
    const paymentStatus = newOutstanding <= 0 ? 'Paid' : 'Partially Paid';

    await supabase
      .from('vendor_purchases')
      .update({ amount_paid: newPaid, payment_status: paymentStatus })
      .eq('id', purchaseId);

    const today = new Date().toISOString().split('T')[0];

    // Insert vendor_payment record (linked to purchase for cleanup on deletion)
    const { data: paymentRecord, error: paymentError } = await supabase.from('vendor_payments').insert({
      vendor_id: vendorId,
      amount,
      payment_date: today,
      payment_method: method,
      notes: notes ?? null,
      reference_id: purchaseId,
      reference_type: 'purchase',
      reference_number: referenceNumber || null
    }).select('id').single();

    if (paymentError) {
      console.error("Failed to insert vendor payment:", paymentError.message);
      return;
    }

    await get().addLedgerEntry(vendorId, {
      date: today,
      type: 'Payment Made',
      description: notes || `Payment via ${method} for purchase`,
      debit: amount,
      credit: 0,
    });

    // ── Route payment to correct financial register based on method
    const isBankOrCheque = method === 'Bank Transfer' || method === 'Cheque';

    if (isBankOrCheque) {
      // Bank Transfer / Cheque → create a cheques record so it appears on Bank & Cheques page
      const chequeNumber = referenceNumber || `BT-${Date.now().toString().slice(-6)}`; // Auto-ref for bank transfers
      const { error: chequeErr } = await supabase.from('cheques').insert({
        cheque_number: chequeNumber,
        vendor_id: vendorId,
        amount,
        issue_date: today,
        expected_clearance_date: today,
        bank_name: method === 'Bank Transfer' ? 'Bank Transfer' : 'Cheque Payment',
        status: 'Cleared', // Bank transfers are instant — mark cleared
        notes: `${method} for purchase — ${notes || ''}`,
        reference_id: purchaseId,
        reference_type: 'VENDOR_PURCHASE',
      });
      if (chequeErr) console.error("Failed to insert cheque:", chequeErr.message);
    } else {
      // Cash → only goes to cash_entries
      const cashDayId = await getOpenCashDayId();
      if (cashDayId) {
        await supabase.from('cash_entries').insert({
          cash_day_id: cashDayId,
          entry_type: 'out',
          category: 'Vendor Payment',
          amount: amount,
          description: notes || `Payment for purchase`,
          reference_id: purchaseId,
          reference_type: 'VENDOR_PURCHASE',
        });
      }
    }

    await get().fetchPurchases();
  },


  // ── Computed
  getOutstanding: (vendorId) => {
    return Math.max(0, get().getPayables()
      .filter(p => p.vendorId === vendorId)
      .reduce((s, p) => s + p.remainingAmount, 0));
  },

  getTotalPayables: () => {
    return get().getPayables().reduce((sum, p) => sum + p.remainingAmount, 0);
  },

  getPayables: () => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. From Vendor Purchases
    const purchasePayables: VendorPayable[] = get().purchases
      .filter(p => p.outstanding > 0)
      .map(p => ({
        id: p.id,
        vendorId: p.vendorId,
        purchaseRef: p.purchaseRef,
        purchaseDate: p.purchaseDate,
        dueDate: p.dueDate ?? p.purchaseDate,
        paymentTermsDays: p.paymentTermsDays,
        totalAmount: p.totalAmount,
        paidAmount: p.amountPaid,
        remainingAmount: p.outstanding,
        status: (() => {
          if (p.outstanding <= 0) return 'Paid' as const;
          if ((p.dueDate ?? '') < today) return 'Overdue' as const;
          if (p.amountPaid > 0) return 'Partially Paid' as const;
          return 'Pending' as const;
        })(),
        description: p.items.map((i: any) => i.itemName).join(', ') || 'Stock Purchase',
        type: 'purchase' as any,
      }));

    // 2. From Advance Bookings
    const bookingPayables: VendorPayable[] = get().bookings
      .filter(b => b.remainingBalance > 0 && b.status !== 'Cancelled')
      .map(b => ({
        id: b.id,
        vendorId: b.vendorId,
        purchaseRef: b.bookingRef,
        purchaseDate: b.bookingDate,
        dueDate: b.expectedDeliveryDate,
        paymentTermsDays: 0,
        totalAmount: b.totalValue,
        paidAmount: b.advancePaid,
        remainingAmount: b.remainingBalance,
        status: (() => {
          if (b.remainingBalance <= 0) return 'Paid' as const;
          if (b.expectedDeliveryDate < today) return 'Overdue' as const;
          if (b.advancePaid > 0) return 'Partially Paid' as const;
          return 'Pending' as const;
        })(),
        description: `Booking: ${b.items.map((i: any) => i.itemName).join(', ') || 'Contract'}`,
        type: 'booking' as any,
      }));

    return [...purchasePayables, ...bookingPayables].sort((a, b) => 
      new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    );
  },

  getOverduePayables: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().getPayables().filter(p => (p.dueDate ?? '') < today);
  },

  getUpcomingPayables: (days) => {
    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
    return get().getPayables().filter(p =>
      (p.dueDate ?? '') >= today && (p.dueDate ?? '') <= future
    );
  },
}));