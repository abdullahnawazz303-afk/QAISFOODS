import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useActiveLanguage } from "@/hooks/useActiveLanguage";
import { useTranslation } from "react-i18next";

export function LanguageSync() {
  const { i18n } = useTranslation();
  const activeLang = useActiveLanguage();

  useEffect(() => {
    i18n.changeLanguage(activeLang);
    document.documentElement.dir = activeLang === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = activeLang;

    if (activeLang === "ur") {
      document.documentElement.classList.add("ur-lang");
    } else {
      document.documentElement.classList.remove("ur-lang");
    }
  }, [activeLang, i18n]);

  return null;
}
