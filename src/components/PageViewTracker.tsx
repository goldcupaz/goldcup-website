import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { trackPageView } from "../lib/websiteAnalytics";

/** Tracks page_view on each client-side route change (public routes only). */
export function PageViewTracker() {
  const { pathname } = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    trackPageView();
  }, [pathname]);

  return null;
}
