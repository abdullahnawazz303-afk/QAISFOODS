import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { isPortalRoute } from '@/hooks/useActiveLanguage';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { language, toggleLanguage, portalLanguage, togglePortalLanguage } = useUIStore();

  const isPortal = isPortalRoute(location.pathname);
  const activeLang = isPortal ? portalLanguage : language;
  const activeToggle = isPortal ? togglePortalLanguage : toggleLanguage;

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={activeToggle} 
      className={cn("flex items-center gap-2 font-mono", className)}
      title={activeLang === "ur" ? "Switch to English" : "اردو میں تبدیل کریں"}
      data-no-translate
    >
      <Globe className="h-4 w-4 shrink-0" />
      <span 
        className="text-sm font-black tracking-widest uppercase select-none text-current" 
        style={{ textTransform: 'uppercase', fontStyle: 'normal' }} 
        data-no-translate
      >
        {activeLang === "ur" ? "EN" : "UR"}
      </span>
    </Button>
  );
}
