"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import PageTransition from "@/components/PageTransition";
import NotificationProvider from "@/components/NotificationProvider";
import { api } from "@/lib/api";

export default function MainLayout({ children }: LayoutProps<"/">) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.replace("/login");
      return;
    }
    // Intentional: gates client-only auth state (reads localStorage) so the
    // server and first client render agree on `null` before this resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <NotificationProvider />
      <PageTransition>{children}</PageTransition>
      <BottomNav />
    </div>
  );
}
