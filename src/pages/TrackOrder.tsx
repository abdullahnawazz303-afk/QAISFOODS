import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, Package, CheckCircle, XCircle, Clock, AlertTriangle, Leaf, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";
import { TranslatedText } from "@/components/TranslatedText";
import { useUIStore } from "@/stores/uiStore";

interface UnifiedOrderItem {
  id: string;
  item_name: string;
  urdu_name: string | null;
  grade: string | null;
  packing: string | null;
  quantity_kg: number;
}

interface UnifiedOrder {
  id: string;
  order_ref: string;
  guest_name: string;
  guest_phone: string;
  status: "Pending" | "Approved" | "Rejected" | "Converted" | "Cancelled";
  notes: string | null;
  total_amount: number;
  created_at: string;
  order_items: UnifiedOrderItem[];
  type: "guest" | "online";
}

const STATUS_CONFIG = {
  Pending:   { icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50  border-amber-200",  label: "Pending Review" },
  Approved:  { icon: CheckCircle,  color: "text-green-600",  bg: "bg-green-50  border-green-200",  label: "Approved" },
  Rejected:  { icon: XCircle,      color: "text-red-600",    bg: "bg-red-50    border-red-200",    label: "Rejected" },
  Converted: { icon: CheckCircle,  color: "text-blue-600",   bg: "bg-blue-50   border-blue-200",   label: "Converted to Sale" },
  Cancelled: { icon: X,            color: "text-gray-500",   bg: "bg-gray-50   border-gray-200",   label: "Cancelled" },
};

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [ref, setRef] = useState(searchParams.get("ref") || "");
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const { language } = useUIStore();
  const dir = language === 'ur' ? 'rtl' : 'ltr';

  // Auto-search if params provided on load
  useEffect(() => {
    if (searchParams.get("phone")) {
      handleSearch();
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanPhone = phone.trim().replace(/[\s-]/g, "");
    if (!cleanPhone) { toast.error(language === 'ur' ? "براہ کرم اپنا فون نمبر درج کریں" : "Please enter your phone number"); return; }

    setLoading(true);
    setSearched(false);

    try {
      const { data, error } = await supabase.rpc("track_public_orders", {
        p_phone: cleanPhone,
        p_ref: ref.trim() || null,
      });

      if (error) throw error;

      const combinedOrders = (data || []).sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrders(combinedOrders);
      if (combinedOrders.length === 1) {
        setExpandedId(combinedOrders[0].id);
      }
      setSearched(true);
    } catch (err) {
      console.error(err);
      toast.error(language === 'ur' ? "تلاش ناکام ہو گئی۔ براہ کرم دوبارہ کوشش کریں۔" : "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (order: UnifiedOrder) => {
    if (order.status !== "Pending") return;
    if (!confirm(language === 'ur' ? `آرڈر ${order.order_ref} منسوخ کریں؟ اسے کالعدم نہیں کیا جا سکتا۔` : `Cancel order ${order.order_ref}? This cannot be undone.`)) return;

    setCancelling(order.id);

    let error;
    if (order.type === "online") {
      const { error: err } = await supabase
        .from("online_orders")
        .update({ status: "Cancelled", notes: (order.notes ? order.notes + "\n" : "") + "Cancelled by customer via Track Order page." })
        .eq("id", order.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("guest_orders")
        .update({ status: "Cancelled", notes: (order.notes ? order.notes + "\n" : "") + "Cancelled by customer via Track Order page." })
        .eq("id", order.id)
        .eq("guest_phone", order.guest_phone);
      error = err;
    }

    setCancelling(null);

    if (error) {
      toast.error(language === 'ur' ? "آرڈر منسوخ نہیں کیا جا سکا۔ براہ کرم ہم سے براہ راست رابطہ کریں۔" : "Could not cancel order. Please contact us directly.");
      return;
    }

    // Update local state
    setOrders((prev) =>
      prev.map((o) => o.id === order.id ? { ...o, status: "Cancelled" as const } : o)
    );
    toast.success(language === 'ur' ? `آرڈر ${order.order_ref} منسوخ کر دیا گیا۔` : `Order ${order.order_ref} cancelled.`);

    // Notify admin via WhatsApp
    const { notifyAdminWhatsApp } = await import("@/lib/whatsapp");
    notifyAdminWhatsApp({
      type: order.type === "online" ? "customer" : "guest",
      orderRef: order.order_ref,
      name: order.guest_name,
      phone: order.guest_phone,
      action: "cancelled",
      items: order.order_items.map((i) => ({
        itemName: i.item_name,
        quantity: i.quantity_kg,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10 overflow-x-hidden w-full max-w-full" dir={dir}>
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Leaf className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight"><TranslatedText text="Track Your Order" /></h1>
          <p className="text-muted-foreground text-sm">
            <TranslatedText text="Enter your phone number to find your guest orders" />
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white dark:bg-card rounded-2xl shadow-xs border p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground"><TranslatedText text="Phone Number" /> *</label>
            <input
              type="tel"
              placeholder={language === 'ur' ? "03001234567" : "e.g. 03001234567"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/30 text-left"
              dir="ltr"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground"><TranslatedText text="Order Reference (optional)" /></label>
            <input
              type="text"
              placeholder={language === 'ur' ? "GO-20260422-0042" : "e.g. GO-20260422-0042"}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/30 text-left"
              dir="ltr"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-md disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> <TranslatedText text="Searching..." /></>
            ) : (
              <><Search className="h-4 w-4" /> <TranslatedText text="Find My Orders" /></>
            )}
          </button>
        </form>

        {/* Results */}
        <AnimatePresence mode="wait">
          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {orders.length === 0 ? (
                <div className="bg-white dark:bg-card rounded-2xl border p-10 text-center space-y-3">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <p className="font-semibold text-foreground"><TranslatedText text="No orders found" /></p>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText text="Double-check your phone number, or" />{" "}
                    <Link to="/shop" className="text-primary hover:underline font-medium"><TranslatedText text="place a new order" /> {language === 'ur' ? '←' : '→'}</Link>
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground font-medium px-1">
                    <TranslatedText text="Found" /> {language === 'ur' ? orders.length.toLocaleString('ur-PK') : orders.length} <TranslatedText text={`order${orders.length !== 1 ? "s" : ""}`} /> <TranslatedText text="for your phone number" />
                  </p>
                  {orders.map((order) => {
                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
                    const Icon = cfg.icon;
                    const isExpanded = expandedId === order.id;
                    const isCancellable = order.status === "Pending";

                    return (
                      <div key={order.id} className="bg-white dark:bg-card rounded-2xl border shadow-xs overflow-hidden">
                        {/* Order header */}
                        <button
                          className="w-full text-left p-5 flex items-center gap-4 hover:bg-muted/20 transition-colors"
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        >
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${cfg.bg}`}>
                            <Icon className={`h-5 w-5 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-foreground text-sm" dir="ltr">{order.order_ref}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
                                <TranslatedText text={cfg.label} />
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                              {new Date(order.created_at).toLocaleDateString(language === 'ur' ? "ur-PK" : "en-PK", { day: "numeric", month: "short", year: "numeric" })}
                              {" · "}
                              {order.order_items.length} {language === 'ur' ? 'آئٹمز' : `item${order.order_items.length !== 1 ? "s" : ""}`}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                        </button>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="border-t px-5 pb-5 space-y-4">
                            <div className="pt-4 space-y-2">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider"><TranslatedText text="Order Items" /></p>
                              <div className="space-y-1.5">
                                {order.order_items.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/30">
                                    <div>
                                      <span className="font-medium text-foreground">{language === 'ur' ? (item.urdu_name || item.item_name) : item.item_name}</span>
                                      {item.grade && (
                                        <span className="mx-2 px-1.5 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary">
                                          {language === 'ur' ? `گریڈ ${item.grade}` : `Grade ${item.grade}`}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-semibold text-foreground" dir="ltr">{item.quantity_kg} {language === 'ur' ? 'کلو' : 'kg'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Admin notes (visible if any) */}
                            {order.notes && !order.notes.includes("Cancelled by customer") && (
                              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
                                <span className="font-semibold"><TranslatedText text="Factory Note" />: </span>{order.notes}
                              </div>
                            )}

                            {/* Rejection reason */}
                            {order.status === "Rejected" && (
                              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span><TranslatedText text="Your order was rejected. Please contact us for more information." /></span>
                              </div>
                            )}

                            {/* Cancel button */}
                            {isCancellable && (
                              <button
                                onClick={() => handleCancel(order)}
                                disabled={cancelling === order.id}
                                className="w-full h-10 rounded-full border-2 border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                              >
                                {cancelling === order.id ? (
                                  <><Loader2 className="h-4 w-4 animate-spin" /> <TranslatedText text="Cancelling..." /></>
                                ) : (
                                  <><X className="h-4 w-4" /> <TranslatedText text="Cancel This Order" /></>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to shop */}
        <div className="text-center">
          <Link to="/shop" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            {language === 'ur' ? 'شاپ پر واپس جائیں ←' : '← Back to Shop'}
          </Link>
        </div>
      </div>
    </div>
  );
}
