import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { OnlineOrder, OnlineOrderStatus, OnlineOrderItem } from '@/types';

interface OnlineOrderState {
  orders: OnlineOrder[];
  loading: boolean;
  error: string | null;

  fetchOrders: () => Promise<void>;
  fetchMyOrders: (customerId: string) => Promise<void>;
  addOrder: (customerId: string, items: OnlineOrderItem[], notes?: string, deliveryDate?: string) => Promise<string | null>;
  updateStatus: (orderId: string, status: OnlineOrderStatus, adminNotes?: string) => Promise<boolean>;
}

export const useOnlineOrderStore = create<OnlineOrderState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  // ── Admin: fetch ALL orders
  fetchOrders: async () => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('online_orders')
      .select(`
        *,
        customers(name, phone, city),
        online_order_items(*)
      `)
      .order('order_date', { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    const orders: OnlineOrder[] = (data || []).map((row: any) => ({
      id: row.id,
      date: row.order_date?.split('T')[0] ?? row.order_date,
      customerEmail: '',
      customerName: row.customers?.name ?? '',
      customerPhone: row.customers?.phone ?? '',
      customerCity: row.customers?.city ?? '',
      customerId: row.customer_id,
      orderRef: row.order_ref ?? '',
      status: row.status as OnlineOrderStatus,
      adminNotes: row.notes ?? '',
      requestedDeliveryDate: row.requested_delivery_date ?? '',
      items: (row.online_order_items || []).map((i: any) => ({
        itemName: i.item_name,
        grade: i.grade,
        quantity: i.quantity_kg,
        notes: i.notes ?? '',
      })),
    }));

    set({ orders, loading: false });
  },

  // ── Customer: fetch only THEIR orders
  fetchMyOrders: async (customerId) => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('online_orders')
      .select('*, online_order_items(*)')
      .eq('customer_id', customerId)
      .order('order_date', { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    const orders: OnlineOrder[] = (data || []).map((row: any) => ({
      id: row.id,
      date: row.order_date?.split('T')[0] ?? row.order_date,
      customerEmail: '',
      customerName: '',
      customerPhone: '',
      customerCity: '',
      customerId: row.customer_id,
      orderRef: row.order_ref ?? '',
      status: row.status as OnlineOrderStatus,
      adminNotes: row.notes ?? '',
      requestedDeliveryDate: row.requested_delivery_date ?? '',
      items: (row.online_order_items || []).map((i: any) => ({
        itemName: i.item_name,
        grade: i.grade,
        quantity: i.quantity_kg,
        notes: i.notes ?? '',
      })),
    }));

    set({ orders, loading: false });
  },

  // ── Customer: place a new order
  addOrder: async (customerId, items, notes, deliveryDate) => {
    const totalAmount = 0; // price confirmed by admin later

    const { data: orderRow, error: orderErr } = await supabase
      .from('online_orders')
      .insert({
        customer_id: customerId,
        requested_delivery_date: deliveryDate ?? null,
        status: 'Pending',
        total_amount: totalAmount,
        notes: notes ?? null,
      })
      .select('id, order_ref')
      .single();

    if (orderErr || !orderRow) {
      console.error('Order insert failed:', orderErr?.message);
      return null;
    }

    // Insert order items
    const { error: itemsErr } = await supabase
      .from('online_order_items')
      .insert(
        items.map((i) => ({
          order_id: orderRow.id,
          item_name: i.itemName,
          grade: i.grade,
          quantity_kg: i.quantity,
          notes: i.notes ?? null,
        }))
      );

    if (itemsErr) {
      // Rollback order
      await supabase.from('online_orders').delete().eq('id', orderRow.id);
      console.error('Order items insert failed:', itemsErr.message);
      return null;
    }

    // Refresh orders
    await get().fetchMyOrders(customerId);
    return orderRow.id;
  },

  // ── Admin: update order status
  updateStatus: async (orderId, status, adminNotes) => {
    const updateData: any = { status };

    if (adminNotes !== undefined) updateData.notes = adminNotes;
    if (status === 'Confirmed')  updateData.confirmed_at = new Date().toISOString();
    if (status === 'Delivered')  updateData.delivered_at = new Date().toISOString();
    if (status === 'Cancelled')  updateData.cancelled_at = new Date().toISOString();

    const { error } = await supabase
      .from('online_orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('Status update failed:', error.message);
      return false;
    }

    // Update local state immediately
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId
          ? { ...o, status, adminNotes: adminNotes ?? o.adminNotes }
          : o
      ),
    }));

    return true;
  },
}));