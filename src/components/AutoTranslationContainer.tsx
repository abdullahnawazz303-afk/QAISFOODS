import React, { useEffect } from "react";
import { useActiveLanguage } from "@/hooks/useActiveLanguage";

// In-memory persistent cache to minimize Google API requests
const translationCache: Record<string, string> = {};
const reverseTranslationCache: Record<string, string> = {
  "ویب سائٹ": "Website",
  "ویب سائیٹ": "Website",
  "لاگ آؤٹ": "Logout",
  "اکاؤنٹ": "Account",
  "آپریشنز": "Operations",
  "فنانس": "Finance",
  "دیگر": "Others",
  "ڈیش بورڈ": "Dashboard",
  "آئٹمز کا نظم کریں": "Manage Items",
  "انوینٹری": "Inventory",
  "سیلز": "Sales",
  "گاہکوں": "Customers",
  "گاہک کی درخواستیں": "Customer Requests",
  "پیشگی بکنگ": "Advance Bookings",
  "بینک چیک": "Bank Cheques",
  "ڈیلی کیش فلو": "Daily Cash Flow",
  "رپورٹس": "Reports",
  "آن لائن آرڈرز": "Online Orders",
  "آن لائن گیسٹ آرڈرز": "Online Guest Orders",
  "یو آر": "UR",
  "ای این": "EN"
};
const reversePlaceholderCache: Record<string, string> = {};

export function AutoTranslationContainer({ children }: { children: React.ReactNode }) {
  const activeLang = useActiveLanguage();

  useEffect(() => {
    const target = document.body;

    if (activeLang === "en") {
      // Restoration pass: restore all original English text and placeholders
      const restoreNode = (root: Node) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let textNode: Node | null = walker.currentNode;

        while (textNode) {
          if (textNode.nodeType === Node.TEXT_NODE) {
            const currentText = textNode.textContent?.trim();
            const original = (textNode as any)._originalText || (currentText ? reverseTranslationCache[currentText] : undefined);
            
            if (original !== undefined) {
              if ((textNode as any)._originalText !== undefined) {
                textNode.textContent = (textNode as any)._originalText;
              } else {
                textNode.textContent = original;
              }
              
              const parent = textNode.parentElement;
              if (parent) {
                // Remove injected Urdu styles
                parent.style.fontFamily = "";
                parent.style.lineHeight = "";
              }
            }
          }
          textNode = walker.nextNode();
        }

        if (root instanceof Element) {
          const inputs = root.querySelectorAll("input[placeholder], textarea[placeholder]");
          inputs.forEach((input) => {
            const el = input as HTMLInputElement | HTMLTextAreaElement;
            const currentPlaceholder = el.getAttribute("placeholder")?.trim();
            const originalPlaceholder = (el as any)._originalPlaceholder || (currentPlaceholder ? reversePlaceholderCache[currentPlaceholder] : undefined);
            
            if (originalPlaceholder !== undefined) {
              el.setAttribute("placeholder", originalPlaceholder);
              el.style.fontFamily = "";
            }
          });
        } else if (root instanceof Document || root instanceof DocumentFragment) {
          const inputs = root.querySelectorAll("input[placeholder], textarea[placeholder]");
          inputs.forEach((input) => {
            const el = input as HTMLInputElement | HTMLTextAreaElement;
            const currentPlaceholder = el.getAttribute("placeholder")?.trim();
            const originalPlaceholder = (el as any)._originalPlaceholder || (currentPlaceholder ? reversePlaceholderCache[currentPlaceholder] : undefined);
            
            if (originalPlaceholder !== undefined) {
              el.setAttribute("placeholder", originalPlaceholder);
              el.style.fontFamily = "";
            }
          });
        }
      };

      restoreNode(target);

      // Deploy active observer in English mode to instantly clean any leftover Urdu texts (dynamic portals/dialogs)
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "characterData") {
            const node = mutation.target as Text;
            const currentText = node.textContent?.trim();
            if (currentText && /[\u0600-\u06FF]/.test(currentText)) {
              const original = (node as any)._originalText || reverseTranslationCache[currentText];
              if (original !== undefined) {
                node.textContent = original;
                if (node.parentElement) {
                  node.parentElement.style.fontFamily = "";
                  node.parentElement.style.lineHeight = "";
                }
              }
            }
          } else if (mutation.type === "childList") {
            mutation.addedNodes.forEach((addedNode) => {
              restoreNode(addedNode);
            });
          }
        });
      });

      observer.observe(target, { childList: true, characterData: true, subtree: true });

      return () => observer.disconnect();
    }

    const translateNode = async (node: Text) => {
      const originalText = node.textContent?.trim();
      if (!originalText) return;

      // Only translate strings containing actual English letters
      if (!/[a-zA-Z]/.test(originalText)) return;

      // Skip dynamic currency outputs, formatted weights, pure numbers, times, and dates
      if (/^[\d,.\s\-+/:%RsPKR]+$/.test(originalText)) return;
      if (/^\d+\s*kg$/i.test(originalText)) return;
      if (/^PKR\s*[\d,.]+$/i.test(originalText)) return;

      // Skip grade identifiers (A+, A, B, C) and "Grade X" text
      if (/^(Grade\s+)?(A\+|A|B|C)$/i.test(originalText)) return;

      // Snap the original English text before setting Urdu translation
      if ((node as any)._originalText === undefined) {
        (node as any)._originalText = node.textContent;
      }

      // Check cache first
      if (translationCache[originalText]) {
        const result = translationCache[originalText];
        node.textContent = result;
        reverseTranslationCache[result] = originalText;
        const parent = node.parentElement;
        if (parent) {
          parent.style.fontFamily = "Noto Nastaliq Urdu, 'Jameel Noori Nastaleeq', serif";
          parent.style.lineHeight = "1.8";
        }
        return;
      }

      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ur&dt=t&q=${encodeURIComponent(originalText)}`;
        const res = await fetch(url);
        const data = await res.json();
        const result = data[0].map((item: any) => item[0]).join("");
        
        translationCache[originalText] = result;
        reverseTranslationCache[result] = originalText;
        node.textContent = result;

        const parent = node.parentElement;
        if (parent) {
          parent.style.fontFamily = "Noto Nastaliq Urdu, 'Jameel Noori Nastaleeq', serif";
          parent.style.lineHeight = "1.8";
        }
      } catch (e) {
        console.error("AutoTranslation error:", e);
      }
    };

    const translatePlaceholder = async (el: HTMLInputElement | HTMLTextAreaElement) => {
      const originalText = el.getAttribute("placeholder");
      if (!originalText || !/[a-zA-Z]/.test(originalText)) return;
      if (/^[\d,.\s\-+/:%RsPKR]+$/.test(originalText)) return;
      
      // Skip grade identifiers (A+, A, B, C) and "Grade X" text
      if (/^(Grade\s+)?(A\+|A|B|C)$/i.test(originalText)) return;

      // Snap the original English placeholder before setting Urdu translation
      if ((el as any)._originalPlaceholder === undefined) {
        (el as any)._originalPlaceholder = originalText;
      }

      if (translationCache[originalText]) {
        const result = translationCache[originalText];
        el.setAttribute("placeholder", result);
        reversePlaceholderCache[result] = originalText;
        el.style.fontFamily = "Noto Nastaliq Urdu, 'Jameel Noori Nastaleeq', serif";
        return;
      }

      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ur&dt=t&q=${encodeURIComponent(originalText)}`;
        const res = await fetch(url);
        const data = await res.json();
        const result = data[0].map((item: any) => item[0]).join("");
        
        translationCache[originalText] = result;
        reversePlaceholderCache[result] = originalText;
        el.setAttribute("placeholder", result);
        el.style.fontFamily = "Noto Nastaliq Urdu, 'Jameel Noori Nastaleeq', serif";
      } catch (e) {
        console.error("Placeholder translation error:", e);
      }
    };

    const traverseAndTranslate = (root: Node) => {
      // 1. Translate text nodes
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null = walker.currentNode;

      while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const parent = node.parentElement;
          if (
            parent &&
            !["SCRIPT", "STYLE", "INPUT", "TEXTAREA"].includes(parent.tagName) &&
            !parent.hasAttribute("data-no-translate")
          ) {
            translateNode(node as Text);
          }
        }
        node = walker.nextNode();
      }

      // 2. Translate input/textarea placeholders
      if (root instanceof Element) {
        const inputs = root.querySelectorAll("input[placeholder], textarea[placeholder]");
        inputs.forEach((input) => {
          translatePlaceholder(input as HTMLInputElement | HTMLTextAreaElement);
        });
      } else if (root instanceof Document || root instanceof DocumentFragment) {
        const inputs = root.querySelectorAll("input[placeholder], textarea[placeholder]");
        inputs.forEach((input) => {
          translatePlaceholder(input as HTMLInputElement | HTMLTextAreaElement);
        });
      }
    };

    // Run translation on existing elements
    traverseAndTranslate(target);

    // Dynamic Mutation Observer to translate newly injected or modified text (including portals)
    const observer = new MutationObserver((mutations) => {
      // Disconnect to avoid triggering the observer during updates
      observer.disconnect();

      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          const node = mutation.target as Text;
          const originalText = node.textContent?.trim();
          if (originalText && /[a-zA-Z]/.test(originalText) && !Object.values(translationCache).includes(originalText)) {
            translateNode(node);
          }
        } else if (mutation.type === "childList") {
          mutation.addedNodes.forEach((addedNode) => {
            traverseAndTranslate(addedNode);
          });
        }
      });

      // Resume observing
      observer.observe(target, { childList: true, characterData: true, subtree: true });
    });

    observer.observe(target, { childList: true, characterData: true, subtree: true });

    return () => observer.disconnect();
  }, [activeLang]);

  return (
    <div className="contents">
      {children}
    </div>
  );
}
