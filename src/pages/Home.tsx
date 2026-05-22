import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, Package } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { HeroSlider } from "@/components/HeroSlider";
import { supabase } from "@/integrations/supabase/client";
import { useRateCardStore } from "@/stores/rateCardStore";
import { ProductCard, type ShopItem } from "@/components/ProductCard";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "@/components/TranslatedText";
import { fetchFeaturedReviews } from '@/integrations/supabase/client';

type Review = {
  text: string;
  author: string;
  role: string;
  date: string; // added date string
};



const fadeSlide = (dir: "up" | "left" | "right" = "up") => ({
  hidden: {
    opacity: 0,
    y: dir === "up" ? 40 : 0,
    x: dir === "left" ? -40 : dir === "right" ? 40 : 0,
  },
  visible: {
    opacity: 1, y: 0, x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
});

export default function Home() {
  const [featuredItems, setFeaturedItems] = useState<ShopItem[]>([]);
  const { rates, fetchRates } = useRateCardStore();
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState<Review[]>([]);
  

  useEffect(() => {
    fetchRates();
    const fetchFeatured = async () => {
      const featuredEnglishNames = [
        "Chawal 386",
        "Dal Masoor",
        "Surkh Lobiya",
        "Safaid Chana Chakna B90"
      ];

      const { data } = await supabase
        .from("item_names")
        .select("*")
        .in("english_name", featuredEnglishNames)
        .eq("is_active", true);
      
      if (data) {
        const sorted = featuredEnglishNames
          .map(enName => data.find(i => i.english_name === enName))
          .filter(Boolean) as ShopItem[];
        setFeaturedItems(sorted);
      }
    };

    // Fetch featured reviews for homepage
    const fetchReviews = async () => {
      const { data, error } = await fetchFeaturedReviews();
      if (data) {
        // data is an array of arrays (reviews per featured position)
        const flat = (data as any[]).flat();
        // sort by created_at if exists, else keep order, then take first 3
        const sorted = flat
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);
        // map to Review type, ensure date field
        const reviews: Review[] = sorted.map((r: any) => ({
          text: r.text,
          author: r.author,
          role: r.role ?? '',
          date: r.created_at ? new Date(r.created_at).toLocaleDateString() : ''
        }));
        setTestimonials(reviews);
      }
      if (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    fetchFeatured();
    fetchReviews();
  }, [fetchRates]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">

      {/* ── Hero Slider ─────────────────────────────── */}
      <HeroSlider />

      {/* ── Testimonials ───────────────────────────── */}
      <section className="py-24 md:py-32 bg-[#F9F9F9] dark:bg-muted/20 relative overflow-hidden">
        {/* Decorative Blob */}
        <div className="absolute left-[-200px] top-[10%] w-[600px] h-[600px] bg-primary/5 blob-shape pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <motion.div
            className="mb-16 md:mb-20 text-center"
            variants={fadeSlide("up")}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-[0.2em] uppercase mb-4">
              {t('customer_reviews')}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground uppercase leading-[1.1] max-w-3xl mx-auto">
              {t('trusted_by_businesses')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((tItem, i) => (
              <motion.div
                key={i}
                className="p-8 md:p-10 rounded-4xl bg-white dark:bg-card border border-border shadow-xs hover:shadow-lg transition-all duration-300 relative flex flex-col justify-between"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5 }}
              >
                <div className="text-primary text-5xl font-serif leading-none mb-4 opacity-20">"</div>
                <p className="text-base text-foreground leading-relaxed font-medium mb-8">
                  <TranslatedText text={tItem.text} />
                </p>
                <div>
                  <h4 className="font-bold text-foreground uppercase tracking-wider">
                    <TranslatedText text={tItem.author} />
                  </h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                    <TranslatedText text={tItem.role} />
                  </p>
                  {tItem.date && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {tItem.date}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Categories ───────────────────── */}
      <section className="py-24 md:py-32 bg-white dark:bg-background relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeSlide("left")}
            >
              <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-[0.2em] uppercase mb-4">
                {t('our_catalogue')}
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground uppercase leading-[1.1]">
                {t('featured_categories')}
              </h2>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Link to="/shop" className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/5 text-primary font-bold hover:bg-primary hover:text-white transition-colors">
                {t('view_full_shop')} 
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredItems.map((item) => {
              const itemRates = rates.filter(r => r.item_name === item.name).map(r => r.price_per_kg);
              const lowestPrice = itemRates.length > 0 ? Math.min(...itemRates) : null;
              
              return (
                <ProductCard
                  key={item.id}
                  item={item}
                  lowestPrice={lowestPrice}
                />
              );
            })}
            {featuredItems.length === 0 && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="relative py-28 md:py-36 overflow-hidden">
        {/* Background Blob for CTA */}
        <div className="absolute inset-0 bg-primary/5 dark:bg-card"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blob-shape-2 pointer-events-none"></div>

        <motion.div
          className="max-w-4xl mx-auto text-center px-4 relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}
        >
          <motion.div variants={fadeSlide("up")}>
            <span className="inline-block py-1.5 px-4 rounded-full bg-white dark:bg-background text-primary font-bold text-xs tracking-[0.2em] uppercase mb-6 shadow-xs">
              {t('partner_with_us')}
            </span>
          </motion.div>
          <motion.h2 variants={fadeSlide("up")} className="text-5xl md:text-6xl lg:text-7xl font-display font-black text-foreground mb-6 uppercase leading-[1.1]">
            {t('ready_to_work')}
          </motion.h2>
          <motion.p variants={fadeSlide("up")} className="text-muted-foreground mb-12 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            {t('partner_desc')}
          </motion.p>
          <motion.div variants={fadeSlide("up")} className="flex flex-wrap justify-center gap-5">
            <Link to="/contact">
              <Button size="lg" className="rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-base px-10 h-14 border-0 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                {t('contact_us')} <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/shop">
              <Button size="lg" variant="outline" className="rounded-full bg-white dark:bg-card border-[3px] border-border text-foreground font-bold text-base px-10 h-14 hover:border-primary hover:text-primary transition-all hover:-translate-y-1 shadow-xs hover:shadow-md">
                {t('browse_shop')} <Package className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
