import { useState } from "react";
import { X, MapPin, User, Phone, Mail, Home, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { notifyAdminWhatsApp } from "@/lib/whatsapp";
import { TranslatedText } from "@/components/TranslatedText";
import { useUIStore } from "@/stores/uiStore";

interface GuestCheckoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function GuestCheckoutModal({ onClose, onSuccess }: GuestCheckoutModalProps) {
  const { items } = useCartStore();
  const { language } = useUIStore();
  const dir = language === 'ur' ? 'rtl' : 'ltr';

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [orderRef, setOrderRef] = useState("");

  const shareLocation = () => {
    if (!navigator.geolocation) {
      toast.error(language === 'ur' ? "اس ڈیوائس پر لوکیشن سپورٹ نہیں ہے" : "Location not supported on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
        toast.success(language === 'ur' ? "لوکیشن حاصل کر لی گئی!" : "Location captured!");
      },
      () => {
        toast.error(language === 'ur' ? "لوکیشن حاصل نہیں کی جا سکی۔ براہ کرم دستی طور پر پتہ درج کریں۔" : "Could not get location. Please enter address manually.");
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    setSubmitting(true);

    try {
      const locationUrl =
        lat && lng
          ? `https://www.google.com/maps?q=${lat},${lng}`
          : null;

      const totalKgs = items.reduce(
        (sum, item) => sum + item.entries.reduce((s, e) => s + Number(e.kgs), 0),
        0
      );

      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
        locationUrl,
        lat,
        lng,
        items: items.flatMap((item) =>
          item.entries.map((entry) => ({
            item_name: item.itemName,
            english_name: item.englishName,
            grade: entry.grade,
            packing: entry.packing,
            quantity_kg: Number(entry.kgs),
          }))
        ),
      };

      const { data, error } = await supabase.rpc("submit_public_order", { payload });

      if (error) throw error;
      if (!data || !data.success) throw new Error("Failed to place order");

      const ref = data.order_ref;
      const isRegistered = data.type === 'customer';

      setOrderRef(ref);
      setDone(true);

      // Notify admin via WhatsApp
      notifyAdminWhatsApp({
        type: isRegistered ? "customer" : "guest",
        orderRef: ref,
        name: name.trim(),
        phone: phone.trim(),
        action: "placed",
        items: items.flatMap((item) =>
          item.entries.map((entry) => ({
            itemName: `${item.englishName} (${entry.grade})`,
            quantity: Number(entry.kgs),
          }))
        ),
      });

      setTimeout(() => {
        onSuccess();
      }, 8000); // Give time to copy reference
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4" dir={dir}>
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {done ? (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground"><TranslatedText text="Order Placed!" /></h2>
                <p className="text-muted-foreground text-sm mt-2">
                  <TranslatedText text="Your order has been received. We will contact you at" /> <strong dir="ltr">{phone}</strong>.
                </p>
              </div>
              {/* Order Ref */}
              <div className="w-full rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider"><TranslatedText text="Your Order Reference" /></p>
                <p className="text-2xl font-mono font-bold text-primary tracking-wider" dir="ltr">{orderRef}</p>
                <p className="text-xs text-muted-foreground"><TranslatedText text="Save this to track your order status" /></p>
              </div>
              <a
                href={`/track-order?phone=${encodeURIComponent(phone)}&ref=${encodeURIComponent(orderRef)}`}
                className="w-full h-11 rounded-full bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors text-sm"
              >
                <ExternalLink className="h-4 w-4" /> <TranslatedText text="Track My Order" />
              </a>
              <button
                onClick={onClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <TranslatedText text="Close" />
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div>
                  <h2 className="text-lg font-bold"><TranslatedText text="Checkout Details" /></h2>
                  <p className="text-xs text-muted-foreground"><TranslatedText text="Fill in your details to place the order" /></p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" /> <TranslatedText text="Full Name" /> *
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'ur' ? "مثال: احمد علی" : "e.g. Ahmad Ali"}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> <TranslatedText text="Phone Number" /> *
                  </label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={language === 'ur' ? "0300-1234567" : "e.g. 0300-1234567"}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/30 text-left"
                    dir="ltr"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" /> <TranslatedText text="Email (optional)" />
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={language === 'ur' ? "ahmad@example.com" : "e.g. ahmad@example.com"}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/30 text-left"
                    dir="ltr"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-primary" /> <TranslatedText text="Address (optional)" />
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={language === 'ur' ? "گلی، شہر، صوبہ" : "Street, City, Province"}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> <TranslatedText text="Your Location (optional)" />
                  </label>
                  {lat && lng ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="flex-1"><TranslatedText text="Location captured" as="span" />: <span dir="ltr">{lat.toFixed(4)}, {lng.toFixed(4)}</span></span>
                      <a
                        href={`https://www.google.com/maps?q=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-700 underline text-xs"
                      >
                        <TranslatedText text="View" />
                      </a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={shareLocation}
                      disabled={locating}
                      className="w-full h-10 rounded-lg border-2 border-dashed border-primary/30 text-primary text-sm font-semibold flex items-center justify-center gap-2 hover:border-primary/60 hover:bg-primary/5 transition-colors disabled:opacity-60"
                    >
                      {locating ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> <TranslatedText text="Locating..." /></>
                      ) : (
                        <><MapPin className="h-4 w-4" /> <TranslatedText text="Share My Location" /></>
                      )}
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    <TranslatedText text="Your location helps us plan delivery. This is optional." />
                  </p>
                </div>

                {/* Order summary */}
                <div className="rounded-xl bg-muted/40 p-3 space-y-1.5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide"><TranslatedText text="Order Summary" /></p>
                  {items.map((item) => (
                    <div key={item.itemId} className="text-sm flex justify-between">
                      <span className="text-foreground font-medium">{language === 'ur' ? item.itemName : item.englishName}</span>
                      <span className="text-muted-foreground" dir="ltr">
                        {item.entries.reduce((s, e) => s + Number(e.kgs), 0)} {language === 'ur' ? 'کلو' : 'kg'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-11 rounded-full border border-border text-foreground font-semibold hover:bg-muted transition-colors"
                  >
                    <TranslatedText text="Cancel" />
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-11 rounded-full bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-60"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> <TranslatedText text="Placing..." /></>
                    ) : (
                      <TranslatedText text="Place Order" />
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
