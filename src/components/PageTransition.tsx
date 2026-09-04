"use client";

import { usePathname } from "next/navigation";

/**
 * Lightweight route-change transition: remounting on pathname change
 * re-triggers the CSS fade/slide-in animation (see .page-transition in
 * globals.css) — no animation library needed for this.
 */
export default function PageTransition({
  children,
  variant = "fade",
}: {
  children: React.ReactNode;
  variant?: "fade" | "slide";
}) {
  const pathname = usePathname();
  return (
    <div
      key={pathname}
      className={variant === "slide" ? "page-transition-slide" : "page-transition"}
    >
      {children}
    </div>
  );
}
