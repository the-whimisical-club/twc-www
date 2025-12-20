"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top on page load, reload, and navigation
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // Also scroll on initial mount (handles reloads)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return null;
}

