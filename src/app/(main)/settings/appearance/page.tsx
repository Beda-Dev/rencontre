"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TopBar from "@/components/TopBar";
import { BackIcon, CheckIcon } from "@/components/icons";
import {
  ICON_VARIANTS,
  IconVariantKey,
  getIconVariant,
  setIconVariant,
} from "@/lib/iconVariant";

const VARIANT_DESCRIPTIONS: Record<IconVariantKey, string> = {
  default: "L'icône et le nom habituels de l'application.",
  notes: "Déguise l'app en bloc-notes sur ton écran d'accueil — le contenu reste inchangé.",
};

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<IconVariantKey>("default");

  useEffect(() => {
    // Intentional: reads a cookie, client-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(getIconVariant());
  }, []);

  function handleSelect(key: IconVariantKey) {
    setIconVariant(key);
    setSelected(key);
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <TopBar
        title="Apparence"
        right={
          <button onClick={() => router.back()} className="p-1">
            <BackIcon className="h-5 w-5" />
          </button>
        }
      />

      <div className="space-y-6 px-4 py-6">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-sm text-white/70">
            Choisis l&apos;icône et le nom affichés sur ton écran d&apos;accueil, un peu
            comme Grindr propose une icône discrète.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(ICON_VARIANTS) as IconVariantKey[]).map((key) => {
            const v = ICON_VARIANTS[key];
            const active = selected === key;
            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`relative flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition ${
                  active
                    ? "border-blue-400 bg-blue-400/10"
                    : "border-white/10 bg-white/5 hover:border-white/25"
                }`}
              >
                {active && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-400 text-black">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                )}
                <Image
                  src={`/icons/128?variant=${key}`}
                  alt={v.appName}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 rounded-2xl border border-white/10"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{v.shortName}</p>
                  <p className="mt-1 text-xs text-white/50">{VARIANT_DESCRIPTIONS[key]}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3">
          <p className="text-xs leading-relaxed text-yellow-200/80">
            Limite technique des applications web : l&apos;icône est figée au moment où
            tu ajoutes l&apos;app à l&apos;écran d&apos;accueil. Pour appliquer ce
            changement, supprime l&apos;icône existante puis réutilise le menu du
            navigateur « Ajouter à l&apos;écran d&apos;accueil ».
          </p>
        </div>
      </div>
    </div>
  );
}
