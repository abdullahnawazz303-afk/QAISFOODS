import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Calendar, User } from "lucide-react";
import { fetchAllReviews } from "@/integrations/supabase/client";

type Review = {
  id: string;
  text: string;
  author: string;
  role: string;
  created_at: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchAllReviews();
      if (data) setReviews(data as Review[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-background">
      {/* Hero */}
      <section className="relative py-24 md:py-32 bg-white dark:bg-card border-b overflow-hidden">
        <div className="absolute left-[-200px] top-[-100px] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-[-200px] bottom-[-100px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative z-10">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-[0.2em] uppercase mb-6">
              <Star className="h-3.5 w-3.5 fill-primary" />
              Customer Reviews
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black text-foreground uppercase leading-[1.1] mb-6">
              What Our Clients Say
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Real reviews from our valued business partners across Pakistan.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 rounded-3xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <motion.div
              className="text-center py-24"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-xl font-semibold text-muted-foreground">No reviews yet.</p>
              <p className="text-muted-foreground mt-2">Be the first to share your experience!</p>
            </motion.div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-8 font-medium">
                {reviews.length} verified review{reviews.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {reviews.map((review, i) => (
                  <motion.div
                    key={review.id}
                    className="bg-white dark:bg-card border border-border rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 relative"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: (i % 6) * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -4 }}
                  >
                    {/* Quote mark */}
                    <div className="text-primary text-5xl font-serif leading-none mb-4 opacity-15 select-none">"</div>

                    {/* Review text */}
                    <p className="text-base text-foreground leading-relaxed font-medium mb-6 flex-1">
                      {review.text}
                    </p>

                    {/* Footer */}
                    <div className="border-t border-border pt-4 mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground uppercase tracking-wide text-sm">
                            {review.author}
                          </p>
                          {review.role && (
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">
                              {review.role}
                            </p>
                          )}
                        </div>
                      </div>
                      {review.created_at && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(review.created_at)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
