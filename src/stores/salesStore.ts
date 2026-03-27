import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useInventoryStore } from './inventoryStore';
import type { Sale, PaymentStatus } from '@/types';

interface SalesState {
  sales: Sale[];
  loading: boolean;
  error: string | null;

  fetchSales: () => Promise<void>;
  addSale: (s: Omit<Sale, 'id' | 'outstanding' | 'paymentStatus'> & { paymentMethod?: string; referenceNumber?: string }) => Promise<string | null>;
  addPayment: (saleId: string, amount: number, method?: string, notes?: string, referenceNumber?: string) => Promise<Sale | null>;
  deleteSale: (saleId: string) => Promise<{ success: boolean; error?: string }>;
  updateSaleMetadata: (saleId: string, updates: { date?: string; notes?: string; totalAmount?: number }) => Promise<{ success: boolean; error?: string }>;
}

// ── Helper: get or create today's cash day and return its id
// Returns null if the day is closed (entries cannot be added)
const getOpenCashDayId = async (): Promise<string | null> => {
  const today = new Date().toISOString().split('T')[0];

  // Try to fetch existing day
  const { data: existing } = await supabase
    .from('cash_days')
    .select('id, is_closed')
    .eq('business_date', today)
    .maybeSingle();

  if (existing) {
    return existing.is_closed ? null : existing.id;
  }

  // No day exists yet — create it
  // Opening balance = last closed day's closing balance
  const { data: lastClosed } = await supabase
    .from('cash_days')
    .select('closing_balance')
    .eq('is_closed', true)
    .order('business_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const openingBalance = lastClosed?.closing_balance ?? 0;

  const { data: newDay, error } = await supabase
    .from('cash_days')
    .insert({ business_date: today, opening_balance: openingBalance, is_closed: false })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create cash day:', error.message);
    return null;
  }

  return newDay.id;
};

// ── Helper: get previous running balance for a customer ledger
const getLastCustomerBalance = async (customerId: string): Promise<number> => {
  const { data } = await supabase
    .from('customer_ledger')
    .select('running_balance')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.running_balance ?? 0;
};

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: [],
  loading: false,
  error: null,

  // ── Fetch all sales with their items
  fetchSales: async () => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers(name),
        sale_items(
          *,
          inventory_batches(item_name, grade)
        )
      `)
      .order('sale_date', { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    const sales: Sale[] = (data || []).map((row: any) => ({
      id: row.id,
      saleRef: row.sale_ref ?? '',
      date: row.sale_date,
      customerId: row.customer_id,
      customerName: row.customers?.name ?? '',
      items: (row.sale_items || []).map((i: any) => ({
        batchId: i.batch_id,
        itemName: i.inventory_batches?.item_name ?? '',
        grade: i.inventory_batches?.grade ?? '',
        quantity: i.quantity_kg,
        salePrice: i.sale_price_per_kg,
        subtotal: i.subtotal,
      })),
      totalAmount: row.total_amount,
      amountPaid: row.amount_paid,
      outstanding: row.outstanding,
      paymentStatus: row.payment_status as PaymentStatus,
      notes: row.notes ?? '',
    }));

    set({ sales, loading: false });
  },

  // ── Add a new sale
  // Flow:
  //   1. Insert sale row  → DB trigger posts debit to customer_ledger automatically
  //   2. Insert sale_items → DB trigger deducts inventory automatically
  //   3. If amountPaid > 0, manually post a credit to customer_ledger
  //   4. If amountPaid > 0, add cash-in entry to today's cash day
  addSale: async (s) => {
    set({ loading: true, error: null });

    const outstanding = s.totalAmount - s.amountPaid;
    const paymentStatus: PaymentStatus =
      outstanding <= 0 ? 'Paid'
      : s.amountPaid > 0 ? 'Partially Paid'
      : 'Unpaid';

    // ── Step 1: Insert sale record
    // DB trigger `trg_post_sale_to_ledger` fires here and posts debit entry
    const { data: saleRow, error: saleErr } = await supabase
      .from('sales')
      .insert({
        customer_id: s.customerId,
        sale_date: s.date,
        total_amount: s.totalAmount,
        amount_paid: s.amountPaid,
        payment_status: paymentStatus,
        online_order_id: s.onlineOrderId ?? null,
        notes: s.notes ?? null,
      })
      .select('id, sale_ref')
      .single();

    if (saleErr || !saleRow) {
      console.error('Sale insert failed:', saleErr?.message);
      set({ error: saleErr?.message ?? 'Sale insert failed', loading: false });
      return null;
    }

    // ── Pre-flight check: validate stock levels
    const batchIds = s.items.map(i => i.batchId);
    const { data: currentBatches } = await supabase
      .from('inventory_batches')
      .select('id, remaining_qty_kg, item_name')
      .in('id', batchIds);

    if (currentBatches) {
      for (const item of s.items) {
        const b = currentBatches.find(cb => cb.id === item.batchId);
        if (b && item.quantity > b.remaining_qty_kg) {
          await supabase.from('sales').delete().eq('id', saleRow.id);
          const errStr = `Not enough stock for ${b.item_name}. Only ${b.remaining_qty_kg}kg available.`;
          set({ error: errStr, loading: false });
          return null;
        }
      }
    }

    // ── Step 2: Insert sale items
    const { error: itemsErr } = await supabase
      .from('sale_items')
      .insert(
        s.items.map((item) => ({
          sale_id: saleRow.id,
          batch_id: item.batchId,
          quantity_kg: item.quantity,
          sale_price_per_kg: item.salePrice,
        }))
      );

    if (itemsErr) {
      // Items failed — the sale record exists but is empty.
      // Delete the orphaned sale to keep DB clean.
      await supabase.from('sales').delete().eq('id', saleRow.id);
      console.error('Sale items insert failed (sale rolled back):', itemsErr.message);
      set({ error: itemsErr.message, loading: false });
      return null;
    }

    // ── Step 2b: Deduct inventory for each item & record OUT movement
    // The DB trigger trg_deduct_inventory_on_sale may or may not exist in Supabase.
    // We do this explicitly in JS to guarantee stock is always updated.
    const inventoryStore = useInventoryStore.getState();
    for (const item of s.items) {
      if (!item.batchId) continue;
      // Deduct from batch (updates remaining_qty_kg in DB + local state)
      const deducted = await inventoryStore.deductFromBatch(item.batchId, item.quantity);
      if (!deducted) {
        console.warn(`Could not deduct inventory for batch ${item.batchId}. Stock may be insufficient.`);
      }
      // Log an OUT movement in inventory_movements for audit trail
      await supabase.from('inventory_movements').insert({
        batch_id: item.batchId,
        movement_type: 'OUT',
        quantity_kg: item.quantity,
        reference_type: 'SALE',
        reference_id: saleRow.id,
        notes: `Sale ${saleRow.sale_ref} — ${item.itemName}`,
      });
    }

    // ── Step 3: If customer paid upfront, post credit to their ledger
    // (The DB trigger only posts the debit/sale. The payment credit must be manual.)
    if (s.amountPaid > 0) {
      const prevBalance = await getLastCustomerBalance(s.customerId);

      await supabase.from('customer_ledger').insert({
        customer_id: s.customerId,
        entry_date: s.date,
        transaction_type: 'Payment Received',
        description: `Payment received with sale ${saleRow.sale_ref}`,
        debit: 0,
        credit: s.amountPaid,
        running_balance: prevBalance - s.amountPaid,
        reference_type: 'SALE',
        reference_id: saleRow.id,
      });
    }

    // ── Step 4: Record cash-in or cheque if payment was made today
    if (s.amountPaid > 0) {
      const method = s.paymentMethod || 'Cash';
      const isBankOrCheque = method === 'Bank Transfer' || method === 'Cheque';

      if (isBankOrCheque) {
        const chequeNumber = s.referenceNumber || `BTC-${Date.now().toString().slice(-6)}`;
        await supabase.from('cheques').insert({
          cheque_number: chequeNumber,
          customer_id: s.customerId,
          amount: s.amountPaid,
          issue_date: s.date,
          expected_clearance_date: s.date,
          bank_name: method === 'Bank Transfer' ? 'Bank Transfer' : 'Customer Cheque',
          status: 'Cleared',
          notes: `Upfront payment with sale — ${s.notes || ''}`,
          reference_id: saleRow.id,
          reference_type: 'SALE'
        });
      } else {
        const cashDayId = await getOpenCashDayId();
        if (cashDayId) {
          await supabase.from('cash_entries').insert({
            cash_day_id: cashDayId,
            entry_type: 'in',
            category: 'Sale Revenue',
            amount: s.amountPaid,
            description: `Sale ${saleRow.sale_ref} — ${s.notes || 'Cash payment'}`,
            reference_id: saleRow.id,
            reference_type: 'SALE'
          });
        }
      }
    }

    await get().fetchSales();
    return saleRow.id;
  },

  // ── Record a payment against an existing sale
  addPayment: async (saleId, amount, method = 'Cash', notes = '', referenceNumber) => {
    const sale = get().sales.find((s) => s.id === saleId);
    if (!sale) return null;

    if (amount <= 0) return null;
    if (amount > sale.outstanding) {
      console.warn('Payment exceeds outstanding amount');
    }

    const newPaid       = sale.amountPaid + amount;
    const newOutstanding = sale.totalAmount - newPaid;
    const paymentStatus: PaymentStatus =
      newOutstanding <= 0 ? 'Paid' : 'Partially Paid';

    // ── Update sale record
    const { error: updateErr } = await supabase
      .from('sales')
      .update({ amount_paid: newPaid, payment_status: paymentStatus })
      .eq('id', saleId);

    if (updateErr) {
      set({ error: updateErr.message });
      return null;
    }

    // ── Post credit to customer ledger
    const prevBalance = await getLastCustomerBalance(sale.customerId);

    await supabase.from('customer_ledger').insert({
      customer_id: sale.customerId,
      entry_date: new Date().toISOString().split('T')[0],
      transaction_type: 'Payment Received',
      description: `Payment received — Sale ${saleId}`,
      debit: 0,
      credit: amount,
      running_balance: prevBalance - amount,
      reference_type: 'SALE',
      reference_id: saleId,
    });

    // ── Route to cash flow or cheques based on method
    const isBankOrCheque = method === 'Bank Transfer' || method === 'Cheque';

    if (isBankOrCheque) {
      const chequeNumber = referenceNumber || `BTC-${Date.now().toString().slice(-6)}`;
      await supabase.from('cheques').insert({
        cheque_number: chequeNumber,
        customer_id: sale.customerId,
        amount: amount,
        issue_date: new Date().toISOString().split('T')[0],
        expected_clearance_date: new Date().toISOString().split('T')[0],
        bank_name: method === 'Bank Transfer' ? 'Bank Transfer' : 'Customer Cheque',
        status: 'Cleared',
        notes: `Customer payment for sale — ${notes}`,
        reference_id: saleId,
        reference_type: 'SALE'
      });
    } else {
      const cashDayId = await getOpenCashDayId();
      if (cashDayId) {
        await supabase.from('cash_entries').insert({
          cash_day_id: cashDayId,
          entry_type: 'in',
          category: 'Customer Payment',
          amount: amount,
          description: `Payment from customer — Sale ${saleId}`,
          reference_id: saleId,
          reference_type: 'SALE'
        });
      }
    }

    // ── Update local state immediately (no full re-fetch needed)
    const updated: Sale = {
      ...sale,
      amountPaid: newPaid,
      outstanding: newOutstanding,
      paymentStatus,
    };

    set((st) => ({
      sales: st.sales.map((s) => (s.id === saleId ? updated : s)),
    }));

    return updated;
  },

  // ── Admin: Delete Sale
  // Deletes the sale, restores inventory, inserts a reversal ledger entry.
  // The DB check constraint "remaining_not_exceed" MUST be dropped first via schema_update.sql
  deleteSale: async (saleId) => {
    set({ loading: true });
    
    try {
      const { data: sale } = await supabase
        .from('sales')
        .select('*, online_order_id, sale_items(*)')
        .eq('id', saleId)
        .maybeSingle();
      if (!sale) {
        set({ loading: false });
        if (!get().sales.some(s => s.id === saleId)) return { success: true }; 
        return { success: false, error: 'Sale record not found in database' };
      }

      // Guard: Block deletion if the sale is linked to a Delivered online order
      if (sale.online_order_id) {
        const { data: linkedOrder } = await supabase
          .from('online_orders')
          .select('status')
          .eq('id', sale.online_order_id)
          .maybeSingle();
        if (linkedOrder?.status === 'Delivered') {
          set({ loading: false });
          return { success: false, error: 'Cannot delete a sale linked to a Delivered online order. Cancel the order first.' };
        }
      }

      // 1. Inventory restoration is handled automatically by the DB trigger on sale_items deletion.
      // We skip manual restoration here to avoid the "double-restore" bug (+200kg instead of +100kg).


      // 2. Customer Ledger Reversal (Atomic Check)
      const { data: priorReversal } = await supabase.from('customer_ledger')
        .select('id').eq('reference_id', saleId).eq('transaction_type', 'Adjustment').maybeSingle();

      if (!priorReversal) {
        const prevBalance = await getLastCustomerBalance(sale.customer_id);
        const netImpact = sale.total_amount - (sale.amount_paid || 0);
        if (netImpact > 0) {
          await supabase.from('customer_ledger').insert({
            customer_id: sale.customer_id,
            entry_date: new Date().toISOString().split('T')[0],
            transaction_type: 'Adjustment',
            description: `Reversal of deleted Sale ${sale.sale_ref}`,
            debit: 0, credit: netImpact,
            running_balance: prevBalance - netImpact,
            reference_type: 'SALE', reference_id: saleId
          });
        }

        if (sale.amount_paid > 0) {
          // Clean up any non-cash (Bank/Cheque) payments associated with this sale
          await supabase.from('cheques')
            .delete()
            .eq('reference_id', saleId)
            .eq('reference_type', 'SALE');

          // Sum only the actual Cash payments to ensure precise refunds
          const { data: cashEntries } = await supabase.from('cash_entries')
            .select('amount')
            .eq('reference_id', saleId)
            .eq('reference_type', 'SALE')
            .eq('entry_type', 'in');

          const totalCashPaid = (cashEntries || []).reduce((sum, e) => sum + e.amount, 0);

          if (totalCashPaid > 0) {
            const { data: priorCash } = await supabase.from('cash_entries')
              .select('id').eq('reference_id', saleId).eq('category', 'Refund').maybeSingle();
            if (!priorCash) {
              const cashDayId = await getOpenCashDayId();
              if (cashDayId) {
                await supabase.from('cash_entries').insert({
                  cash_day_id: cashDayId, entry_type: 'out', category: 'Refund',
                  amount: totalCashPaid,
                  description: `Refund Cash for deleted Sale ${sale.sale_ref}`,
                  reference_id: saleId, reference_type: 'SALE'
                });
              }
            }
          }
        }
      }

      // 3. Detach FK references so parent row can be deleted
      await supabase.from('customer_ledger').update({ reference_id: null }).eq('reference_id', saleId);
      await supabase.from('cash_entries').update({ reference_id: null }).eq('reference_id', saleId);
      await supabase.from('inventory_movements').update({ reference_id: null }).eq('reference_id', saleId);

      // 4. Update online order status if applicable
      if (sale.online_order_id) {
        await supabase
          .from('online_orders')
          .update({ 
             status: 'Cancelled',
             admin_notes: `Order reverted: Sale ${sale.sale_ref} was deleted`
          })
          .eq('id', sale.online_order_id);
      }

      // 5. Final Sale Deletion
      await supabase.from('sale_items').delete().eq('sale_id', saleId);
      const { error: delErr } = await supabase.from('sales').delete().eq('id', saleId);
      
      if (delErr) throw delErr;

      await get().fetchSales();
      return { success: true };

    } catch (err: any) {
      console.error('Sale Deletion Failure:', err.message);
      set({ error: err.message, loading: false });
      await get().fetchSales(); 
      return { success: false, error: err.message };
    }
  },

  // ── Admin: Edit Sale — supports editing date, notes, AND total amount
  // If total_amount changes, the difference is reflected in the customer ledger automatically.
  updateSaleMetadata: async (saleId, updates) => {
    try {
      const payload: Record<string, any> = {};
      if (updates.date !== undefined) payload.sale_date = updates.date;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      // Handle total amount change
      if (updates.totalAmount !== undefined) {
        const { data: currentSale } = await supabase
          .from('sales')
          .select('total_amount, amount_paid, customer_id, sale_ref')
          .eq('id', saleId)
          .maybeSingle();

        if (!currentSale) return { success: false, error: 'Sale not found' };

        const newTotal = updates.totalAmount;
        const oldTotal = currentSale.total_amount;
        const amountPaid = currentSale.amount_paid || 0;

        // Guard: total cannot be less than what the customer already paid
        if (newTotal < amountPaid) {
          return { success: false, error: `Cannot set total below amount already paid (PKR ${amountPaid.toLocaleString()})` };
        }

        payload.total_amount = newTotal;
        const newOutstanding = newTotal - amountPaid;
        payload.outstanding = newOutstanding;
        payload.payment_status = newOutstanding <= 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Unpaid';

        // Post a ledger correction entry for the difference
        const diff = newTotal - oldTotal; // positive = increase, negative = discount/correction
        if (diff !== 0) {
          const prevBalance = await getLastCustomerBalance(currentSale.customer_id);
          await supabase.from('customer_ledger').insert({
            customer_id: currentSale.customer_id,
            entry_date: new Date().toISOString().split('T')[0],
            transaction_type: 'Adjustment',
            description: diff < 0
              ? `Correction: Sale ${currentSale.sale_ref} reduced by PKR ${Math.abs(diff).toLocaleString()}`
              : `Correction: Sale ${currentSale.sale_ref} increased by PKR ${diff.toLocaleString()}`,
            debit: diff > 0 ? diff : 0,
            credit: diff < 0 ? Math.abs(diff) : 0,
            running_balance: prevBalance + diff,
            reference_type: 'SALE',
            reference_id: saleId
          });
        }
      }

      const { error } = await supabase.from('sales').update(payload).eq('id', saleId);
      if (error) return { success: false, error: error.message };

      // Update local state
      set((s) => ({
        sales: s.sales.map(sale => {
          if (sale.id !== saleId) return sale;
          const newTotal = updates.totalAmount ?? sale.totalAmount;
          const newOutstanding = Math.max(0, newTotal - (sale.amountPaid || 0));
          return {
            ...sale,
            date: updates.date ?? sale.date,
            notes: updates.notes ?? sale.notes,
            totalAmount: newTotal,
            outstanding: newOutstanding,
            paymentStatus: newOutstanding <= 0 ? 'Paid' : (sale.amountPaid || 0) > 0 ? 'Partially Paid' : 'Unpaid',
          };
        })
      }));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
}));