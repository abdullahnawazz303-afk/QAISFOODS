import aboutImg from "@/assets/about_factory_new.png";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Users, Award } from "lucide-react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const stats = [
  { label: "Years in Business", value: "15+" },
  { label: "Products", value: "6+" },
  { label: "Happy Clients", value: "500+" },
  { label: "Monthly Capacity", value: "100+ Tons" },
];

const values = [
  { icon: Target, title: "Our Mission", desc: "To provide the highest quality lentils and pulses to markets across Pakistan, ensuring purity, consistency, and fair pricing for our wholesale partners." },
  { icon: Eye, title: "Our Vision", desc: "To become Pakistan's most trusted lentil packaging factory, known for quality grading, reliable supply, and modern operations." },
  { icon: Users, title: "Our Team", desc: "A dedicated team of quality inspectors, packaging specialists, and logistics experts who ensure every bag meets our premium standards." },
  { icon: Award, title: "Quality Promise", desc: "Every batch is cleaned, sorted by grade (A+, A, B, C), and packaged under strict quality control before reaching our customers." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const faqs = [
  {
    question: "What is your minimum wholesale order quantity?",
    answer: "Our minimum order quantity for wholesale pricing varies by product, but generally starts at 1,000 kg (1 ton). Contact our sales team for exact minimums based on your chosen lentils."
  },
  {
    question: "Do you offer custom packing sizes?",
    answer: "Yes, we provide packaging solutions ranging from 0.5 kg retail packs to 50 kg bulk sacks, tailored precisely to your distribution and market needs."
  },
  {
    question: "Where do you source your lentils?",
    answer: "We source our legumes directly from trusted, established farms across the most fertile regions of Pakistan, as well as importing premium grades internationally to guarantee year-round supply."
  },
  {
    question: "What quality assurance standards do you follow?",
    answer: "Every batch undergoes rigorous machine cleaning, color sorting, and manual inspection. We grade products meticulously into A+, A, B, and C categories ensuring absolute consistency."
  },
  {
    question: "How do you handle delivery logistics?",
    answer: "We manage a robust logistics network providing reliable, scheduled deliveries to wholesale markets nationwide, ensuring your stock arrives fresh and on time."
  }
];

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={aboutImg} alt="Our factory" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-foreground/70" />
        </div>
        <motion.div
          className="relative text-center px-4 py-24 md:py-36"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-xs font-semibold text-primary-foreground/80 uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
            Since 2010
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-semibold text-white mb-5 tracking-tight">
            About Our Factory
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            A modern lentil processing and packaging facility in the heart of Pakistan, serving wholesale markets with premium quality products.
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-10 md:py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">{s.value}</div>
              <div className="text-sm text-primary-foreground/70 mt-1 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">Our Core</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">What Drives Us</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <Card className="h-full border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-8 flex gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <v.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl text-foreground mb-2">{v.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">Questions</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Everything you need to know about working with us.</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Accordion type="single" collapsible className="w-full bg-card rounded-xl p-6 shadow-sm border">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-display text-lg font-medium py-5 hover:text-primary transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-base pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
