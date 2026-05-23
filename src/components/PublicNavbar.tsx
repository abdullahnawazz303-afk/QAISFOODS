import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { CartDrawer } from "@/components/CartDrawer";
import { AnimatePresence, motion } from "framer-motion";
import { QfLogo } from "@/components/QfLogo";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const cartCount = useCartStore((s) => s.items.length);
  const { language } = useUIStore();
  const { t } = useTranslation();

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const userEmail = useAuthStore((s) => s.userEmail);
  const userRole = useAuthStore((s) => s.userRole);
  const logout = useAuthStore((s) => s.logout);

  const navLinks = [
    { label: t("shop"), to: "/shop" },
    { label: t("track_order"), to: "/track-order" },
    { label: "Reviews", to: "/reviews" },
    { label: t("about"), to: "/about" },
    { label: t("contact"), to: "/contact" },
  ];

  return (
    <>
      <div className="sticky top-0 z-50">
        <header className="bg-primary dark:bg-card text-primary-foreground dark:text-foreground relative shadow-md border-b dark:border-border/10">
          <div className="max-w-7xl mx-auto flex h-24 items-center justify-between px-4 md:px-8">
            
            {/* Overlapping Logo Container */}
            <div className="relative h-full flex items-center w-[160px]">
              <Link 
                to="/" 
                onClick={() => {
                  if (location.pathname === "/") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="absolute top-4 left-0 flex items-center z-10 group bg-white dark:bg-card rounded-br-4xl rounded-tr-4xl px-5 py-2.5 md:px-7 md:py-3.5 border-r border-y border-border/50 dark:border-border shadow-xl transition-transform hover:translate-x-1 hover:shadow-2xl"
              >
                <QfLogo className="group-hover:opacity-90 transition-opacity" />
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-8 pl-5 xl:pl-10">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "text-sm font-bold uppercase tracking-wider xl:tracking-widest transition-all relative py-2 shrink-0",
                    location.pathname === l.to
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                  )}
                  style={language === 'ur' ? { fontFamily: "system-ui, -apple-system, sans-serif", fontSize: '14px' } : {}}
                >
                  {l.label}
                  {location.pathname === l.to && (
                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-white rounded-t-md" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center gap-5">
              <div className="flex items-center text-white/90">
                <ThemeSwitcher className="hover:bg-black/20 hover:text-white" />
                <LanguageSwitcher className="hover:bg-black/20 hover:text-white" />
              </div>

              {/* Cart icon */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-3 rounded-full bg-black/10 hover:bg-black/20 transition-colors text-white"
                aria-label="Open cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-primary text-[11px] font-black flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>

              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-12 h-12 rounded-full bg-white dark:bg-primary text-primary dark:text-white hover:bg-white/90 dark:hover:bg-primary/90 font-black text-sm uppercase shadow-lg border border-primary/20 flex items-center justify-center transition-all hover:scale-105"
                  >
                    {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <>
                        {/* Dropdown Backdrop to close on outside click */}
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={() => setProfileOpen(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-card border border-border/80 p-2 shadow-xl z-50 overflow-hidden"
                        >
                          <div className="px-3.5 py-3 border-b border-border/50 text-left">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5">
                              {language === 'ur' ? 'لاگ ان شدہ اکاؤنٹ' : 'Logged in as'}
                            </span>
                            <span className="text-xs font-bold text-foreground truncate block" title={userEmail || ""}>
                              {userEmail}
                            </span>
                          </div>

                          <div className="py-1">
                            <Link 
                              to={userRole === "customer" ? "/portal" : "/dashboard"}
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-muted/50 transition-colors text-left"
                            >
                              <LayoutDashboard className="h-4 w-4 text-primary" />
                              <span>
                                {userRole === "customer" 
                                  ? (language === 'ur' ? 'میرا پورٹل' : 'My Portal') 
                                  : (language === 'ur' ? 'ایڈمن ڈیش بورڈ' : 'Admin Dashboard')}
                              </span>
                            </Link>

                            <button
                              onClick={() => {
                                setProfileOpen(false);
                                logout();
                              }}
                              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/5 transition-colors text-left"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>{language === 'ur' ? 'لاگ آؤٹ' : 'Log Out'}</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`}>
                  <Button size="default" className="rounded-full bg-white dark:bg-primary text-primary dark:text-white hover:bg-white/95 dark:hover:bg-primary/90 font-black text-xs uppercase tracking-widest px-8 py-6 h-auto shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0">
                    {t('login')}
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile right icons */}
            <div className="lg:hidden flex items-center gap-3">
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2.5 rounded-full bg-black/10 hover:bg-black/20 transition-colors text-white"
                aria-label="Open cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-primary text-[11px] font-black flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>
              <button className="p-2 text-white bg-black/10 rounded-full" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Decorative Curved Bottom Edge (SVG) */}
          <div className="absolute bottom-[-20px] left-0 w-full overflow-hidden leading-0 z-[-1]">
            <svg 
              data-name="Layer 1" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 1200 120" 
              preserveAspectRatio="none" 
              className="relative block w-full h-[22px] drop-shadow-md text-primary dark:text-card"
            >
              <path 
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                className="fill-current"
              ></path>
            </svg>
          </div>
        </header>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <div className="lg:hidden absolute top-full left-0 w-full bg-primary dark:bg-card border-t border-white/10 dark:border-border/30 px-5 pb-6 pt-4 space-y-2 shadow-2xl z-40 rounded-b-3xl">
              {/* Theme & Language Switchers for Mobile */}
              <div className="flex items-center justify-between border-b border-white/10 dark:border-border/30 pb-4 mb-4 text-white/90">
                <span className="text-xs font-black uppercase tracking-widest text-white/60 dark:text-muted-foreground">
                  {language === 'ur' ? 'ترجیحات' : 'Settings'}
                </span>
                <div className="flex items-center gap-2">
                  <ThemeSwitcher className="hover:bg-white/20 text-white hover:text-white" />
                  <LanguageSwitcher className="hover:bg-white/20 text-white hover:text-white" />
                </div>
              </div>

              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block py-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors rounded-xl",
                    location.pathname === l.to 
                      ? "bg-white/20 dark:bg-primary/20 text-white" 
                      : "text-white/80 hover:bg-white/10 dark:hover:bg-primary/10 hover:text-white"
                  )}
                  style={language === 'ur' ? { fontFamily: "system-ui, -apple-system, sans-serif" } : {}}
                >
                  {l.label}
                </Link>
              ))}
              {isLoggedIn ? (
                <div className="mt-6 bg-white/10 dark:bg-primary/10 border border-white/10 dark:border-primary/10 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-primary text-primary dark:text-white font-black text-sm uppercase flex items-center justify-center shrink-0">
                      {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block">
                        {language === 'ur' ? 'لاگ ان شدہ' : 'Logged In'}
                      </span>
                      <span className="text-xs font-bold text-white truncate block">
                        {userEmail}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={userRole === "customer" ? "/portal" : "/dashboard"}
                      onClick={() => setMobileOpen(false)}
                      className="h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>
                        {userRole === "customer" 
                          ? (language === 'ur' ? 'پورٹل' : 'Portal') 
                          : (language === 'ur' ? 'ایڈمن ڈیش بورڈ' : 'Admin Dashboard')}
                      </span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                      }}
                      className="h-10 rounded-xl bg-destructive hover:bg-destructive/95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{language === 'ur' ? 'لاگ آؤٹ' : 'Log Out'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`} onClick={() => setMobileOpen(false)} className="block mt-6">
                  <Button size="default" className="w-full bg-white dark:bg-primary text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-primary/95 font-bold py-6 rounded-full shadow-lg">
                    {t('login')}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
