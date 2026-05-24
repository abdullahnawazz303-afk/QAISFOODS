import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { Search, ShoppingBag, Package, X, SlidersHorizontal, ArrowRight, Flame, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRateCardStore } from "@/stores/rateCardStore";
import { ProductCard, type ShopItem } from "@/components/ProductCard";
import { Link } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { CartDrawer } from "@/components/CartDrawer";
import { TranslatedText } from "@/components/TranslatedText";
import { useUIStore } from "@/stores/uiStore";

const CATEGORIES = [
  { key: "all",    label: "All Products",   urdu: "سب" },
  { key: "dal",    label: "Dal",            urdu: "دال" },
  { key: "chawal", label: "Chawal",         urdu: "چاول" },
  { key: "channe", label: "Channa",         urdu: "چنا" },
  { key: "lobiya", label: "Lobiya",         urdu: "لوبیا" },
  { key: "bajra",  label: "Bajra",          urdu: "باجرہ" },
  { key: "others", label: "Others",         urdu: "دیگر" },
];

export default function Shop() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  
  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"none" | "price-asc" | "price-desc" | "name-asc">("none");
  const [filtersInteractive, setFiltersInteractive] = useState(true);

  const { scrollY } = useScroll();
  const filterOpacity = useTransform(scrollY, [0, 48, 128], [1, 1, 0]);
  const filterY = useTransform(scrollY, [0, 128], [0, -16]);

  useMotionValueEvent(scrollY, "change", (value) => {
    setFiltersInteractive(value < 120);
  });

  const { language } = useUIStore();
  const dir = language === 'ur' ? 'rtl' : 'ltr';

  const { items: cartItems } = useCartStore();
  const { rates, fetchRates } = useRateCardStore();
  const cartCount = cartItems.length;

  useEffect(() => {
    fetchRates();
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("item_names")
        .select("id, name, english_name, category, image_url, is_active")
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (!error && data) setItems(data as ShopItem[]);
      setLoading(false);
    })();
  }, [fetchRates]);

  // Compute lowest prices for items
  const processedItems = items.map(item => {
    const itemRates = rates.filter(r => r.item_name === item.name).map(r => r.price_per_kg);
    const lowestPrice = itemRates.length > 0 ? Math.min(...itemRates) : null;
    return { ...item, lowestPrice };
  });

  // Filter items
  const filtered = processedItems.filter((item) => {
    const matchCategory =
      activeCategory === "all" || item.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      (item.english_name || "").toLowerCase().includes(q) ||
      (item.name || "").includes(search);
      
    // Price filter
    const price = item.lowestPrice;
    const matchMinPrice = minPrice === "" || (price !== null && price >= Number(minPrice));
    const matchMaxPrice = maxPrice === "" || (price !== null && price <= Number(maxPrice));

    return matchCategory && matchSearch && matchMinPrice && matchMaxPrice;
  });

  // Sort items
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price-asc") {
      const pA = a.lowestPrice ?? Infinity;
      const pB = b.lowestPrice ?? Infinity;
      return pA - pB;
    }
    if (sortBy === "price-desc") {
      const pA = a.lowestPrice ?? -Infinity;
      const pB = b.lowestPrice ?? -Infinity;
      return pB - pA;
    }
    if (sortBy === "name-asc") {
      const nameA = language === 'ur' ? a.name : (a.english_name || a.name);
      const nameB = language === 'ur' ? b.name : (b.english_name || b.name);
      return nameA.localeCompare(nameB);
    }
    return 0; // none/default
  });

  // Identify top selling items
  const topSellingItems = processedItems.filter(item =>
    ["دال چنا باریک", "دال مسور", "چاول 386", "سفید لوبیا"].includes(item.name)
  );

  const isInCart = (id: string) => cartItems.some((i) => i.itemId === id);

  return (
    <div className="bg-background pb-20 w-full max-w-full" dir={dir}>
      {/* Page Header Banner (Minimalist) */}
      <section className="bg-background pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <nav className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <Link to="/" className="hover:text-primary transition-colors"><TranslatedText text="Home" /></Link>
            <span className="text-xs">»</span>
            <span className="text-foreground"><TranslatedText text="Products" /></span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground tracking-tight"
            >
              <TranslatedText text="Products" />
            </motion.h1>

            {/* Cart button in header */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-3 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-md"
            >
              <ShoppingBag className="h-5 w-5" />
              <TranslatedText text="View Cart" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center shadow-md border-2 border-white">
                  {cartCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </section>

      {/* Search + Filters — scrolls with page and fades out */}
      <motion.section
        style={{
          opacity: filterOpacity,
          y: filterY,
          pointerEvents: filtersInteractive ? "auto" : "none",
        }}
        className="relative z-20 bg-white/70 dark:bg-black/50 backdrop-blur-md border-b border-border/40 py-4"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row lg:items-center gap-4">
          
          {/* Search bar + Filter Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:flex-1 lg:min-w-0">
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === 'ur' ? "مصنوعات تلاش کریں..." : "Search products..."}
                className="w-full h-12 sm:h-14 pl-12 pr-12 rounded-full border-2 border-border/80 bg-white/70 dark:bg-card/50 text-sm sm:text-base focus:outline-hidden focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-lg hover:border-primary/40 transition-all duration-300 font-medium placeholder:text-muted-foreground/60 backdrop-blur-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`h-12 sm:h-14 px-5 sm:px-6 rounded-full border-2 font-bold flex items-center justify-center gap-2.5 transition-all shadow-md shrink-0 ${
                showFilters || minPrice !== "" || maxPrice !== "" || sortBy !== "none"
                  ? "bg-primary text-white border-primary"
                  : "bg-white/75 dark:bg-card/60 border-border text-foreground hover:border-primary/40"
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">
                <TranslatedText text="Filters" />
              </span>
              {(minPrice !== "" || maxPrice !== "" || sortBy !== "none") && (
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              )}
            </motion.button>
          </div>

          {/* Category pills with Framer Motion layout animations */}
          <div className="flex-1 min-w-0 flex flex-nowrap gap-3 overflow-x-auto pb-2 pt-1 md:py-1 scrollbar-none items-center pr-4">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <motion.button
                  key={cat.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`shrink-0 px-6 py-3 rounded-full text-sm font-bold transition-all border-2 flex items-center gap-2 relative overflow-hidden ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-lg"
                      : "bg-white/75 dark:bg-card/60 text-foreground border-border/80 hover:border-primary/40 hover:bg-primary/5 shadow-xs"
                  }`}
                >
                  <span className="relative z-10">{language === 'ur' ? cat.urdu : cat.label}</span>
                  {isActive && (
                    <motion.span 
                      layoutId="activeCategoryGlow"
                      className="absolute inset-0 bg-linear-to-r from-primary-foreground/10 to-transparent pointer-events-none"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Collapsible Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-muted/30 dark:bg-card/20 border-b border-border/80 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Price Range Inputs */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <TranslatedText text="Filter by Price (Rs/kg)" />
                </h4>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rs</span>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder={language === 'ur' ? "کم سے کم" : "Min"}
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-hidden focus:border-primary font-bold text-left"
                      dir="ltr"
                    />
                  </div>
                  <span className="text-muted-foreground font-black">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rs</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder={language === 'ur' ? "زیادہ سے زیادہ" : "Max"}
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-white dark:bg-card text-sm focus:outline-hidden focus:border-primary font-bold text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Price Presets */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-foreground uppercase tracking-widest">
                  <TranslatedText text="Quick Price Ranges" />
                </h4>
                <div className="flex flex-wrap gap-2">
                  {([
                    { label: language === 'ur' ? "150 سے کم" : "Under 150", min: "", max: 150 },
                    { label: "150 — 250", min: 150, max: 250 },
                    { label: language === 'ur' ? "250 سے زیادہ" : "Over 250", min: 250, max: "" }
                  ] as { label: string; min: number | ""; max: number | "" }[]).map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMinPrice(preset.min);
                        setMaxPrice(preset.max);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-card border border-border hover:border-primary hover:text-primary transition-all shadow-xs"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting & Reset */}
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-foreground uppercase tracking-widest mb-2">
                    <TranslatedText text="Sort Grains By" />
                  </h4>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-white dark:bg-card text-xs font-bold focus:outline-hidden focus:border-primary"
                  >
                    <option value="none">{language === 'ur' ? "عام ترتیب (پہلے سے طے شدہ)" : "Default (Featured)"}</option>
                    <option value="price-asc">{language === 'ur' ? "قیمت: کم سے زیادہ" : "Price: Low to High"}</option>
                    <option value="price-desc">{language === 'ur' ? "قیمت: زیادہ سے کم" : "Price: High to Low"}</option>
                    <option value="name-asc">{language === 'ur' ? "حروف تہجی: الف سے یہ" : "Product Name (A-Z)"}</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {(minPrice !== "" || maxPrice !== "" || sortBy !== "none") && (
                    <button
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                        setSortBy("none");
                      }}
                      className="text-xs font-bold text-destructive hover:underline"
                    >
                      <TranslatedText text="Reset Filters" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Selling Products Showcase (Customer Favorites) */}
      {!loading && !search && activeCategory === "all" && minPrice === "" && maxPrice === "" && topSellingItems.length > 0 && (
        <section className="pt-10 pb-2 relative">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                <Flame className="h-5 w-5 fill-current" />
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                <TranslatedText text="Top Selling Grains" />
                <span className="hidden md:inline-block text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  {language === 'ur' ? 'کسٹمرز کی پہلی پسند' : 'Customer Favorites'}
                </span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {topSellingItems.map((item) => {
                const itemRates = rates.filter(r => r.item_name === item.name).map(r => r.price_per_kg);
                const lowestPrice = itemRates.length > 0 ? Math.min(...itemRates) : null;
                
                return (
                  <ProductCard
                    key={`top-${item.id || item.name}`}
                    item={item}
                    lowestPrice={lowestPrice}
                    inCart={isInCart(item.id || item.name)}
                    isTopSeller={true}
                  />
                );
              })}
            </div>
            
            <div className="border-b border-border/50 mt-12 w-full" />
          </div>
        </section>
      )}

      {/* Main Product Grid */}
      <section className="py-8 md:py-12 relative">
        {/* Subtle background blob */}
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-primary/5 blob-shape pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Results count */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              {loading ? <TranslatedText text="Loading Catalog..." /> : <TranslatedText text={`Showing ${sorted.length} Product${sorted.length !== 1 ? "s" : ""}`} />}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-[2.5rem] bg-muted/40 animate-pulse aspect-3/4" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center gap-4 bg-white dark:bg-card rounded-[3rem] border shadow-xs">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <SlidersHorizontal className="h-10 w-10 text-primary" />
              </div>
              <p className="text-2xl font-display font-black text-foreground"><TranslatedText text="No products found" /></p>
              <p className="text-base text-muted-foreground max-w-md"><TranslatedText text="Try adjusting your search or category filter to find what you're looking for." /></p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                  setMinPrice("");
                  setMaxPrice("");
                  setSortBy("none");
                }}
                className="mt-4 px-8 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg"
              >
                <TranslatedText text="Clear all filters" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {sorted.map((item) => {
                const isTop = ["دال چنا باریک", "دال مسور", "چاول 386", "سفید لوبیا"].includes(item.name);
                return (
                  <ProductCard
                    key={item.id || `idx-${item.name}`}
                    item={item}
                    lowestPrice={item.lowestPrice}
                    inCart={isInCart(item.id || item.name)}
                    isTopSeller={isTop}
                  />
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

