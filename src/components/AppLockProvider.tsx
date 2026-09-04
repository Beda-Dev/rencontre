"use client";

import { useEffect, useState } from "react";
import { shouldLock } from "@/lib/appLock";
import LockScreen from "./LockScreen";

/** Wraps the authenticated app shell: shows LockScreen on top whenever the
 * configured local lock (PIN/device biometric) requires it — on first
 * load, and again whenever the tab regains focus if the auto-lock timer
 * has elapsed. Purely a local UI gate; doesn't touch auth/session state. */
export default function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocked(shouldLock());

    function onVisibility() {
      if (document.visibilityState === "visible" && shouldLock()) setLocked(true);
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <>
      {children}
      {locked && <LockScreen onUnlock={() => setLocked(false)} />}
    </>
  );
}
