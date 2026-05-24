import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ShoppingBag, 
  Package, 
  Plus, 
  Trash2, 
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  MessageSquare,
  Pencil
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore, type CartEntry } from "@/stores/cartStore";
import { useRateCardStore } from "@/stores/rateCardStore";
import { useAuthStore } from "@/stores/authStore";
import { CartDrawer } from "@/components/CartDrawer";
import { toast } from "sonner";
import { TranslatedText } from "@/components/TranslatedText";
import { useUIStore } from "@/stores/uiStore";
import { ProductCard, type ShopItem } from "@/components/ProductCard";


const GRADE_OPTIONS = ["A+", "A", "B", "C"];
const PACKING_OPTIONS = ["0.5 kg", "1 kg"];

const emptyEntry = (): CartEntry => ({ grade: "A", packing: "1 kg", kgs: 0 });

interface ProductReview {
  id: string;
  created_at: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  user_id: string | null;
}

const getOwnedReviewIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem("qais_owned_reviews") || "[]");
  } catch {
    return [];
  }
};

const addOwnedReviewId = (id: string) => {
  const ids = getOwnedReviewIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem("qais_owned_reviews", JSON.stringify(ids));
  }
};

const removeOwnedReviewId = (id: string) => {
  const ids = getOwnedReviewIds().filter(x => x !== id);
  localStorage.setItem("qais_owned_reviews", JSON.stringify(ids));
};


export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const userEmail = useAuthStore((s) => s.userEmail);
  const [item, setItem] = useState<ShopItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const { language } = useUIStore();
  const dir = language === 'ur' ? 'rtl' : 'ltr';

  const { addItem, getItem } = useCartStore();
  const { rates, fetchRates } = useRateCardStore();

  const [entries, setEntries] = useState<CartEntry[]>([emptyEntry()]);


  // Reviews state variables
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);

  // Form fields
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  /** Product reviews use localStorage by default (no 401 from RLS). Set VITE_PRODUCT_REVIEWS_REMOTE=true to use Supabase. */
  const reviewsRemoteEnabled = import.meta.env.VITE_PRODUCT_REVIEWS_REMOTE === "true";
  const [useLocalFallback, setUseLocalFallback] = useState(!reviewsRemoteEnabled);

  const loadLocalReviews = () => {
    if (!item?.id) return;
    const local = localStorage.getItem(`reviews_${item.id}`);
    if (local) {
      try {
        setReviews(JSON.parse(local));
      } catch {
        setReviews([]);
      }
    } else {
      const initialMock: ProductReview[] = [
        {
          id: `mock-1-${item.id}`,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          product_id: item.id,
          reviewer_name: language === 'ur' ? "محمد عثمان" : "Muhammad Usman",
          rating: 5,
          comment: language === 'ur' ? "بہت ہی شاندار اور صاف دال ہے۔ کوالٹی بہترین ہے!" : "Superb quality, very clean grains. Highly recommended!",
          user_id: null
        },
        {
          id: `mock-2-${item.id}`,
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          product_id: item.id,
          reviewer_name: language === 'ur' ? "عمران خان" : "Imran Khan",
          rating: 4,
          comment: language === 'ur' ? "پیکنگ اچھی ہے اور وزن بھی پورا تھا۔ اگلی بار بھی یہیں سے لیں گے۔" : "Good packing and weight was accurate. Will order again.",
          user_id: null
        }
      ];
      localStorage.setItem(`reviews_${item.id}`, JSON.stringify(initialMock));
      setReviews(initialMock);
    }
  };

  const fetchReviews = async () => {
    if (!item?.id) return;
    setReviewsLoading(true);

    if (useLocalFallback) {
      loadLocalReviews();
      setReviewsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", item.id)
        .order("created_at", { ascending: false });

      if (error) {
        setUseLocalFallback(true);
        loadLocalReviews();
      } else {
        setReviews((data ?? []) as ProductReview[]);
      }
    } catch {
      setUseLocalFallback(true);
      loadLocalReviews();
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (item?.id) {
      fetchReviews();
    }
  }, [item?.id, useLocalFallback]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item?.id) return;
    if (!reviewName.trim() || !reviewComment.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmittingReview(true);

    const reviewId = editingReview ? editingReview.id : crypto.randomUUID();
    const newReview: ProductReview = {
      id: reviewId,
      created_at: editingReview ? editingReview.created_at : new Date().toISOString(),
      product_id: item.id,
      reviewer_name: reviewName,
      rating: reviewRating,
      comment: reviewComment,
      user_id: useAuthStore.getState().userId
    };

    if (useLocalFallback) {
      let updatedReviews = [...reviews];
      if (editingReview) {
        updatedReviews = updatedReviews.map(r => r.id === editingReview.id ? newReview : r);
        toast.success("Review updated successfully");
      } else {
        updatedReviews = [newReview, ...updatedReviews];
        addOwnedReviewId(reviewId);
        toast.success("Review added successfully");
      }
      localStorage.setItem(`reviews_${item.id}`, JSON.stringify(updatedReviews));
      setReviews(updatedReviews);
      
      setReviewName("");
      setReviewRating(5);
      setReviewComment("");
      setShowReviewForm(false);
      setEditingReview(null);
      setSubmittingReview(false);
      return;
    }

    try {
      let response;
      if (editingReview) {
        response = await supabase
          .from("product_reviews")
          .update({
            reviewer_name: newReview.reviewer_name,
            rating: newReview.rating,
            comment: newReview.comment
          })
          .eq("id", editingReview.id);
      } else {
        response = await supabase
          .from("product_reviews")
          .insert(newReview);
      }

      if (response.error) {
        toast.error("Failed to submit review");
      } else {
        if (editingReview) {
          toast.success("Review updated successfully");
        } else {
          toast.success("Review added successfully");
          addOwnedReviewId(reviewId);
        }
        fetchReviews();
        setReviewName("");
        setReviewRating(5);
        setReviewComment("");
        setShowReviewForm(false);
        setEditingReview(null);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!item?.id) return;
    
    if (useLocalFallback) {
      const updatedReviews = reviews.filter(r => r.id !== id);
      localStorage.setItem(`reviews_${item.id}`, JSON.stringify(updatedReviews));
      setReviews(updatedReviews);
      removeOwnedReviewId(id);
      toast.success("Review deleted successfully");
      return;
    }

    try {
      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Failed to delete review");
      } else {
        toast.success("Review deleted successfully");
        removeOwnedReviewId(id);
        fetchReviews();
      }
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const handleEditClick = (review: ProductReview) => {
    setEditingReview(review);
    setReviewName(review.reviewer_name);
    setReviewRating(review.rating);
    setReviewComment(review.comment);
    setShowReviewForm(true);
  };

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      fetchRates();

      let query = supabase.from("item_names").select("*");
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(id)) {
        query = query.eq("id", id);
      } else {
        query = query.eq("name", id);
      }

      const { data: product, error } = await query.single();

      if (error || !product) {
        toast.error("Product not found");
        navigate("/shop");
        return;
      }

      setItem(product as ShopItem);

      // Initialize entries if already in cart
      const existing = getItem(product.id);
      if (existing?.entries.length) {
        setEntries(existing.entries.map(e => ({ ...e })));
      } else {
        setEntries([emptyEntry()]);
      }

      // Fetch related items (same category, excluding current)
      if (product.category) {
        const { data: related } = await supabase
          .from("item_names")
          .select("id, name, english_name, category, image_url, is_active")
          .eq("category", product.category)
          .eq("is_active", true)
          .neq("id", product.id)
          .limit(4);
        
        if (related) setRelatedItems(related as ShopItem[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [id, navigate, fetchRates, getItem]);

  const itemRates = rates.filter(r => r.item_name === item?.name);

  const updateEntry = (i: number, field: keyof CartEntry, value: string | number) => {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  };

  const addRow = () => setEntries((prev) => [...prev, emptyEntry()]);
  const removeRow = (i: number) => setEntries((prev) => prev.filter((_, idx) => idx !== i));

  const totalKgs = entries.reduce((sum, e) => sum + (Number(e.kgs) || 0), 0);
  const totalBill = entries.reduce((sum, e) => {
    const rate = itemRates.find(r => r.grade === e.grade);
    const pricePerKg = rate ? rate.price_per_kg : 0;
    return sum + (pricePerKg * (Number(e.kgs) || 0));
  }, 0);

  const handleAddToCart = () => {
    if (!item) return;
    const valid = entries.filter((e) => Number(e.kgs) > 0);
    if (valid.length === 0) {
      toast.error("Please enter a valid quantity in kg");
      return;
    }
    addItem({
      itemId: item.id,
      itemName: item.name,
      englishName: item.english_name || item.name,
      imageUrl: item.image_url,
      entries: valid
    });
    toast.success(`${item.english_name || item.name} updated in your cart`);
    setCartOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse"><TranslatedText text="Loading Premium Grains..." /></p>
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="bg-background pb-24 w-full max-w-full" dir={dir}>
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 glassmorphism-premium border-b border-border/30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            to="/shop" 
            className="flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-primary transition-all duration-300 group py-1.5 px-3 rounded-full hover:bg-primary/5"
          >
            <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${language === 'ur' ? 'group-hover:translate-x-1 rotate-180' : 'group-hover:-translate-x-1'}`} />
            <TranslatedText text="Back to Catalog" />
          </Link>

          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2.5 rounded-full hover:bg-primary/10 text-foreground transition-all duration-300 hover:scale-105 active:scale-95 group"
          >
            <ShoppingBag className="h-5.5 w-5.5 text-foreground group-hover:text-primary transition-colors" />
            {totalKgs > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5.5 h-5.5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-background shadow-md animate-soft-pulse">
                {entries.filter(e => e.kgs > 0).length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 md:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          
          {/* Left Side: Product Image Display */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="aspect-4/3 max-w-[420px] mx-auto w-full rounded-[2.5rem] overflow-hidden bg-linear-to-br from-emerald-50/10 to-emerald-500/5 dark:from-emerald-950/20 dark:to-emerald-900/5 border border-border/40 shadow-2xl relative group premium-emerald-glow smooth-scale-transition hover:scale-[1.01] hover:border-primary/30">
              {item.image_url && !imgError ? (
                <img 
                  src={item.image_url} 
                  alt={item.english_name || item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground bg-muted/20">
                  <Package className="h-20 w-20 opacity-20 text-primary" />
                  <span className="font-black uppercase tracking-widest text-[10px] text-primary/60"><TranslatedText text="No Image Available" /></span>
                </div>
              )}
              
              {/* Badge */}
              <div className="absolute top-6 left-6 flex flex-col gap-2.5">
                <span className="bg-primary text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                  <TranslatedText text="Premium Quality" />
                </span>
                <span className="glassmorphism-premium text-foreground px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md border border-border/30">
                  {item.category}
                </span>
              </div>
            </div>

            {/* Quality Accents */}
            <div className="grid grid-cols-3 gap-3 max-w-[420px] mx-auto w-full">
              {[
                { icon: ShieldCheck, text: "Quality Verified" },
                { icon: Truck, text: "Bulk Delivery" },
                { icon: RotateCcw, text: "Grade Assured" }
              ].map((accent, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3.5 rounded-2xl glassmorphism-premium border border-border/30 shadow-xs text-center smooth-scale-transition hover:-translate-y-1 hover:border-primary/35 hover:shadow-md group">
                  <accent.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center"><TranslatedText text={accent.text} /></span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Configuration Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col"
          >
            {/* Header info */}
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                ))}
                <span className="text-xs font-black text-muted-foreground ml-2">(4.9/5 <TranslatedText text="Rating" as="span" />)</span>
              </div>
              <h1 
                className="text-2xl md:text-3xl font-black text-foreground tracking-tight"
                style={language === 'ur' ? { fontFamily: "Noto Nastaliq Urdu, 'Jameel Noori Nastaleeq', serif", lineHeight: 1.8, paddingBottom: '6px' } : { lineHeight: 1.25 }}
              >
                {language === 'ur' ? item.name : (item.english_name || item.name)}
              </h1>
            </div>

            {/* Live Rates Section */}
            {itemRates.length > 0 && (
              <div className="glassmorphism-premium rounded-3xl p-4 mb-6 border border-primary/20 premium-emerald-glow">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest"><TranslatedText text="Market Live Rates (Rs/KG)" /></span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {GRADE_OPTIONS.map(g => {
                    const rate = itemRates.find(r => r.grade === g);
                    if (!rate) return null;
                    return (
                      <div key={g} className="bg-white/90 dark:bg-card/90 border border-primary/10 px-4 py-2 rounded-2xl shadow-xs hover:border-primary/30 transition-colors">
                        <span className="text-xs font-bold text-muted-foreground mx-1">{language === 'ur' ? `گریڈ ${g}` : `Grade ${g}`}:</span>
                        <span className="text-base font-black text-foreground" dir="ltr">Rs. {rate.price_per_kg}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Configurator */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest"><TranslatedText text="Order Configuration" /></h3>
                <span className="text-[9px] font-black text-muted-foreground bg-muted px-2.5 py-1 rounded-full uppercase"><TranslatedText text="Wholesale Packaging" /></span>
              </div>
              
              <AnimatePresence initial={false}>
                {entries.map((entry, i) => {
                  const currentRate = itemRates.find(r => r.grade === entry.grade)?.price_per_kg || 0;
                  const entryTotal = currentRate * (Number(entry.kgs) || 0);

                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      key={i}
                      className="p-5 rounded-3xl bg-white/60 dark:bg-card/45 border border-border/40 shadow-md space-y-4 relative premium-card-glow smooth-scale-transition hover:border-primary/25 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between border-b border-border/30 pb-3">
                        <span className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                          <Package className="h-4 w-4" /> <TranslatedText text="Batch Variant" as="span" /> {language === 'ur' ? (i + 1).toLocaleString('ur-PK') : i + 1}
                        </span>
                        {entries.length > 1 && (
                          <button 
                            onClick={() => removeRow(i)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/5 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1"><TranslatedText text="Grade" /></label>
                          <select
                            value={entry.grade}
                            onChange={(e) => updateEntry(i, "grade", e.target.value)}
                            className="w-full h-11 px-3 premium-input-style outline-hidden font-bold text-sm"
                          >
                            {GRADE_OPTIONS.map(g => <option key={g} value={g}>{language === 'ur' ? `گریڈ ${g}` : `Grade ${g}`}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1"><TranslatedText text="Packing" /></label>
                          <select
                            value={entry.packing}
                            onChange={(e) => updateEntry(i, "packing", e.target.value)}
                            className="w-full h-11 px-3 premium-input-style outline-hidden font-bold text-sm"
                          >
                            {PACKING_OPTIONS.map(p => <option key={p} value={p}>{p} {language === 'ur' ? 'بیگز' : 'bags'}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5 ml-1"><TranslatedText text="Weight (KG)" /></label>
                          <input
                            type="number"
                            min={0}
                            value={entry.kgs || ""}
                            onChange={(e) => updateEntry(i, "kgs", Number(e.target.value))}
                            placeholder="0.0"
                            className="w-full h-11 px-4 premium-input-style outline-hidden font-bold text-sm text-left"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {entryTotal > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 rounded-2xl glassmorphism-premium border border-primary/10 text-xs">
                          <span className="font-bold text-muted-foreground uppercase tracking-wider"><TranslatedText text="Estimated Batch Cost" /></span>
                          <span className="text-sm font-black text-foreground">Rs. {entryTotal.toLocaleString()}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <button 
                onClick={addRow}
                className="w-full py-3.5 rounded-2xl border border-dashed border-primary/40 text-primary font-black text-xs hover:bg-primary/5 hover:border-primary transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow-md smooth-scale-transition"
              >
                <Plus className="h-4 w-4" /> <TranslatedText text="Add Quality Variation" />
              </button>
            </div>

            {/* Sticky Total Bar or Summary */}
            <div className="mt-auto pt-5 border-t border-border/50">
              {totalKgs > 0 && (
                <div className="flex items-end justify-between mb-4 px-2">
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1"><TranslatedText text="Total Weight" /></span>
                    <span className="text-2xl font-black text-foreground">{totalKgs.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">{language === 'ur' ? 'کلو' : 'kg'}</span></span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1"><TranslatedText text="Grand Estimated Bill" /></span>
                    <span className="text-3xl font-black text-primary" dir="ltr">Rs. {totalBill.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                className="w-full h-13 rounded-full bg-primary text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300 premium-emerald-glow premium-card-glow"
              >
                <ShoppingBag className="h-5 w-5" />
                <TranslatedText text="Add to Wholesale Cart" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* --- CUSTOMER REVIEWS SECTION --- */}
        <section className="mt-24 border-t border-border/30 pt-16">
          <div className="max-w-4xl mx-auto">
            {/* Header / Summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                  <MessageSquare className="h-7 w-7 text-primary" />
                  {language === 'ur' ? 'کسٹمر کے جائزے' : 'Customer Reviews'}
                </h2>
                <p className="text-muted-foreground mt-1.5 text-sm font-medium">
                  {language === 'ur' 
                    ? `ہمارے کسٹمرز کی رائے اس پروڈکٹ کے بارے میں (${reviews.length} جائزے)` 
                    : `What our customers are saying about this product (${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'})`}
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                <div className="glassmorphism-premium px-6 py-4 rounded-3xl border border-primary/25 flex items-center gap-4 shadow-md premium-emerald-glow">
                  <div className="text-center">
                    <span className="text-3xl font-black text-primary block leading-none">
                      {reviews.length > 0 
                        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                        : "0.0"}
                    </span>
                    <span className="text-[9px] font-black text-primary/70 uppercase tracking-widest mt-1 block">
                      {language === 'ur' ? 'اوسط درجہ' : 'Out of 5'}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-primary/20" />
                  <div className="flex flex-col">
                    <div className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const avg = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
                        return (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${star <= Math.round(avg) ? 'fill-amber-500 text-amber-500' : 'text-amber-200 dark:text-muted/30'}`} 
                          />
                        );
                      })}
                    </div>
                    <span className="text-xs font-bold text-muted-foreground mt-1">
                      {reviews.length} {language === 'ur' ? 'جائزے' : 'reviews'}
                    </span>
                  </div>
                </div>

                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      setEditingReview(null);
                      setReviewName(userEmail ? userEmail.split('@')[0] : "");
                      setReviewRating(5);
                      setReviewComment("");
                      setShowReviewForm(!showReviewForm);
                    }}
                    className="h-12 px-6 rounded-full bg-primary text-white font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0 premium-emerald-glow"
                  >
                    {showReviewForm 
                      ? (language === 'ur' ? 'بند کریں' : 'Close Form') 
                      : (language === 'ur' ? 'جائزہ لکھیں' : 'Write a Review')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                    }}
                    className="h-12 px-6 rounded-full bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/25 dark:text-white dark:hover:bg-primary/35 font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                  >
                    {language === 'ur' ? 'جائزہ لکھنے کے لیے لاگ ان کریں' : 'Login to Write a Review'}
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Review Form */}
            <AnimatePresence>
              {showReviewForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -20 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -20 }}
                  className="overflow-hidden mb-12"
                >
                  <form 
                    onSubmit={handleSubmitReview}
                    className="glassmorphism-premium border border-border/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-lg relative premium-emerald-glow"
                  >
                    <h3 className="text-lg font-black text-foreground tracking-tight">
                      {editingReview 
                        ? (language === 'ur' ? 'اپنا جائزہ تبدیل کریں' : 'Edit Your Review') 
                        : (language === 'ur' ? 'اپنا قیمتی جائزہ شیئر کریں' : 'Share Your Honest Review')}
                    </h3>

                    {/* Rating selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                        {language === 'ur' ? 'ستارے منتخب کریں' : 'Your Rating'}
                      </label>
                      <div className="flex gap-2.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="p-1 -m-1 focus:outline-hidden transition-transform hover:scale-125"
                          >
                            <Star 
                              className={`h-8 w-8 transition-colors duration-300 ${
                                star <= reviewRating 
                                  ? 'fill-amber-500 text-amber-500' 
                                  : 'text-muted-foreground/30 hover:text-amber-500'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                        {language === 'ur' ? 'آپ کا نام' : 'Your Name'}
                      </label>
                      <input
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder={language === 'ur' ? "جیسے: محمد عثمان" : "e.g. Muhammad Usman"}
                        required
                        className="w-full h-12 px-4 premium-input-style outline-hidden font-bold text-sm"
                      />
                    </div>

                    {/* Comment input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                        {language === 'ur' ? 'آپ کا تبصرہ' : 'Your Comment'}
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder={language === 'ur' ? "اپنا تبصرہ یہاں لکھیں..." : "Write your review here..."}
                        required
                        rows={4}
                        className="w-full p-4 rounded-2xl premium-input-style outline-hidden font-bold text-sm resize-none"
                      />
                    </div>

                    {/* Form actions */}
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="h-11 px-6 rounded-full bg-primary text-white font-black text-xs uppercase tracking-widest hover:opacity-95 shadow-md flex items-center justify-center gap-2 premium-emerald-glow"
                      >
                        {submittingReview ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          editingReview ? (language === 'ur' ? 'اپڈیٹ کریں' : 'Update Review') : (language === 'ur' ? 'جمع کروائیں' : 'Submit Review')
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowReviewForm(false);
                          setEditingReview(null);
                        }}
                        className="h-11 px-6 rounded-full border border-border bg-white dark:bg-card text-foreground font-black text-xs uppercase tracking-widest hover:bg-muted/50 transition-colors"
                      >
                        {language === 'ur' ? 'کینسل' : 'Cancel'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-bold">{language === 'ur' ? 'جائزے لوڈ ہو رہے ہیں...' : 'Loading reviews...'}</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-muted/10 dark:bg-card/10 border border-dashed border-border rounded-3xl p-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                <h4 className="font-black text-foreground">
                  {language === 'ur' ? 'کوئی جائزہ موجود نہیں' : 'No reviews yet'}
                </h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {language === 'ur' 
                    ? 'اس پروڈکٹ کے لیے ابھی تک کوئی جائزہ نہیں لکھا گیا۔ پہلے بنیں اور اپنا جائزہ شیئر کریں!' 
                    : 'Be the first to share your experience with this premium product.'}
                </p>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="mt-6 h-10 px-6 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-black text-xs uppercase tracking-wider transition-all"
                >
                  {language === 'ur' ? 'پہلا جائزہ لکھیں' : 'Write the first review'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev) => {
                  const isOwned = getOwnedReviewIds().includes(rev.id);
                  const firstChar = (rev.reviewer_name || "?").charAt(0).toUpperCase();
                  
                  const bgColors = [
                    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
                    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  ];
                  const avatarColor = bgColors[firstChar.charCodeAt(0) % bgColors.length];

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glassmorphism-premium border border-border/30 rounded-3xl p-5 md:p-6 shadow-md premium-card-glow smooth-scale-transition hover:border-primary/20 hover:shadow-lg flex gap-4 relative"
                      key={rev.id}
                    >
                      {/* Avatar */}
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${avatarColor}`}>
                        {firstChar}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-black text-foreground text-sm flex items-center gap-2">
                              {rev.reviewer_name}
                              {rev.user_id && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                                  {language === 'ur' ? 'تصدیق شدہ کسٹمر' : 'Verified Buyer'}
                                </span>
                              )}
                            </h4>
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {new Date(rev.created_at).toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>

                          <div className="flex text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-3.5 w-3.5 ${star <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-amber-200 dark:text-muted/20'}`} 
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-sm text-foreground/90 font-medium leading-relaxed wrap-break-word whitespace-pre-line">
                          {rev.comment}
                        </p>
                      </div>

                      {/* Owner actions (Edit / Delete) */}
                      {isOwned && (
                        <div className="absolute top-5 right-5 md:right-6 flex gap-2">
                          <button
                            onClick={() => handleEditClick(rev)}
                            className="p-2 rounded-xl bg-white/70 dark:bg-card/70 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors border border-border/30 shadow-xs"
                            title={language === 'ur' ? 'ترمیم کریں' : 'Edit Review'}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(language === 'ur' ? 'کیا آپ واقعی اس تبصرے کو ڈیلیٹ کرنا چاہتے ہیں؟' : 'Are you sure you want to delete this review?')) {
                                handleDeleteReview(rev.id);
                              }
                            }}
                            className="p-2 rounded-xl bg-white/70 dark:bg-card/70 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors border border-border/30 shadow-xs"
                            title={language === 'ur' ? 'ڈیلیٹ کریں' : 'Delete Review'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* You Might Also Love Section */}
        {relatedItems.length > 0 && (
          <section className="mt-24 md:mt-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight"><TranslatedText text="You Might Also Love" /></h2>
                <p className="text-muted-foreground mt-1"><TranslatedText text="Discover other premium grains in the same category." /></p>
              </div>
              <Link 
                to="/shop" 
                className="flex items-center gap-2 text-sm font-bold text-primary hover:underline group"
              >
                <TranslatedText text="View full catalog" /> <ArrowRight className={`h-4 w-4 transition-transform ${language === 'ur' ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {relatedItems.map(rel => (
                <ProductCard 
                  key={rel.id} 
                  item={rel} 
                  lowestPrice={null} // Prices calculated on card click usually or fetch separately if needed
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
