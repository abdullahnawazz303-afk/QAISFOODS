import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";
import { useActiveLanguage } from "@/hooks/useActiveLanguage";

export function TranslatedText({ text, className, as: Component = "span" }: { text: string; className?: string; as?: any }) {
  const translated = useDynamicTranslation(text);
  const activeLang = useActiveLanguage();
  
  const urduStyle = activeLang === 'ur' 
    ? { fontFamily: "Noto Nastaliq Urdu, 'Jameel Noori Nastaleeq', serif", lineHeight: 1.8 } 
    : {};

  return (
    <Component className={className} style={urduStyle}>
      {translated}
    </Component>
  );
}
