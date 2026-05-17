import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Package, Eye, Award } from "lucide-react";
import { Link } from "react-router-dom";

export interface ShopItem {
  id: string;
  name: string;           // Urdu
  english_name: string | null;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
}

const CATEGORIES = [
  { key: "all",    label: "All Products",   urdu: "سب" },
  { key: "dal",    label: "Dal",            urdu: "دال" },
  { key: "chawal", label: "Chawal",         urdu: "چاول" },
  { key: "channe", label: "Channa",         urdu: "چنا" },
  { key: "lobiya", label: "Lobiya",         urdu: "لوبیا" },
  { key: "bajra",  label: "Bajra",          urdu: "باجرہ" },
  { key: "others", label: "Others",         urdu: "دیگر" },
];

import { useActiveLanguage } from "@/hooks/useActiveLanguage";

export function ProductCard({
  item,
  lowestPrice,
  inCart,
  isTopSeller,
}: {
  item: ShopItem;
  lowestPrice: number | null;
  inCart?: boolean;
  isTopSeller?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const activeLang = useActiveLanguage();
  
  const categoryObj = CATEGORIES.find((c) => c.key === item.category);
  const categoryLabel = activeLang === 'ur' 
    ? (categoryObj?.urdu || "دیگر") 
    : (categoryObj?.label || "Others");

  const displayName = activeLang === 'ur' 
    ? (item.name || item.english_name || "Unknown")
    : (item.english_name || item.name || "Unknown Product");


  return (
    <Link to={`/product/${item.id || item.name}`} className="block h-full outline-none" dir={activeLang === 'ur' ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="group bg-white dark:bg-card rounded-2xl border border-transparent dark:border-border/30 shadow-sm hover:shadow-2xl hover:border-primary/20 overflow-hidden transition-all duration-500 h-full flex flex-col relative product-card"
      >
        {/* Image area */}
        <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-muted/30">
          {isTopSeller && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg border border-white/20">
              <Award className="h-3.5 w-3.5" />
              <span>{activeLang === 'ur' ? 'سب سے زیادہ مقبول' : 'Best Seller'}</span>
            </div>
          )}

          {item.image_url && !imgError ? (
            <img
              src={item.image_url}
              alt={displayName}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Package className="h-12 w-12 text-primary/20" />
            </div>
          )}

          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 pointer-events-none">
            <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                {activeLang === 'ur' ? 'فوری دیکھیں' : 'Quick View'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Content */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              {categoryLabel}
            </span>
            <h3 
              className="text-base font-bold text-foreground group-hover:text-primary transition-colors"
              style={activeLang === 'ur' ? { fontFamily: "Noto Nastaliq Urdu, 'Jameel Noori Nastaleeq', serif", lineHeight: 1.8, paddingBottom: '4px' } : { lineHeight: 1.3 }}
            >
              {displayName}
            </h3>
          </div>

          {/* Pricing & Action */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
            <div>
              {lowestPrice ? (
                <div className="flex items-center gap-1">
                  <span className="text-lg font-black text-foreground">Rs {lowestPrice}</span>
                </div>
              ) : (
                <span className="text-sm font-bold text-muted-foreground">Price varies</span>
              )}
            </div>

            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                inCart
                  ? "bg-primary text-white scale-100"
                  : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:rotate-12"
              }`}
              aria-label="View Product"
            >
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
