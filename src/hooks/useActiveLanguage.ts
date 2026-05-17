import { useLocation } from "react-router-dom";
import { useUIStore } from "@/stores/uiStore";

export function isPortalRoute(path: string): boolean {
  const portalPrefixes = [
    "/portal",
    "/dashboard",
    "/inventory",
    "/sales",
    "/customers",
    "/customer-ledger",
    "/customer-requests",
    "/vendors",
    "/vendor-ledger",
    "/vendor-payables",
    "/advance-bookings",
    "/bank-cheques",
    "/cash-flow",
    "/online-orders",
    "/waste",
    "/reports",
    "/hero-slides",
    "/guest-orders",
    "/manage-items"
  ];
  return portalPrefixes.some(prefix => path === prefix || path.startsWith(prefix + "/"));
}

export function useActiveLanguage() {
  const location = useLocation();
  const { language, portalLanguage } = useUIStore();
  
  const isPortal = isPortalRoute(location.pathname);
  return isPortal ? portalLanguage : language;
}
