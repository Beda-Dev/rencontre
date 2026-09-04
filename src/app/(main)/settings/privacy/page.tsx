"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import TopBar from "@/components/TopBar";
import { BackIcon } from "@/components/icons";
import { mediaUrl } from "@/lib/api";
import {
  useBlockedProfilesQuery,
  useHiddenProfilesQuery,
  useUnblockUserMutation,
  useUnhideProfileMutation,
} from "@/lib/queries";

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { data: blocked, isLoading: blockedLoading } = useBlockedProfilesQuery();
  const { data: hidden, isLoading: hiddenLoading } = useHiddenProfilesQuery();
  const unblock = useUnblockUserMutation();
  const unhide = useUnhideProfileMutation();

  return (
    <div className="mx-auto w-full max-w-lg">
      <TopBar
        title="Confidentialité"
        right={
          <button onClick={() => router.back()} className="p-1">
            <BackIcon className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-4 py-4">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
          Profils bloqués
        </h2>
        {blockedLoading ? (
          <p className="py-4 text-center text-sm text-white/50">Chargement…</p>
        ) : !blocked || blocked.length === 0 ? (
          <p className="py-2 text-sm text-white/40">Aucun profil bloqué.</p>
        ) : (
          <div className="space-y-2">
            {blocked.map((p) => (
              <div
                key={p.profileId}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
                  <Image
                    src={mediaUrl(p.profileImageMediaHash, p.displayName ?? undefined)}
                    alt={p.displayName ?? "Profil"}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <p className="min-w-0 flex-1 truncate text-sm">{p.displayName ?? "—"}</p>
                <button
                  onClick={() => unblock.mutate(p.profileId)}
                  disabled={unblock.isPending}
                  className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 hover:border-white/30"
                >
                  Débloquer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-8">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
          Profils masqués
        </h2>
        {hiddenLoading ? (
          <p className="py-4 text-center text-sm text-white/50">Chargement…</p>
        ) : !hidden || hidden.length === 0 ? (
          <p className="py-2 text-sm text-white/40">Aucun profil masqué.</p>
        ) : (
          <div className="space-y-2">
            {hidden.map((p) => (
              <div
                key={p.profileId}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
                  <Image
                    src={mediaUrl(p.profileImageMediaHash, p.displayName ?? undefined)}
                    alt={p.displayName ?? "Profil"}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <p className="min-w-0 flex-1 truncate text-sm">{p.displayName ?? "—"}</p>
                <button
                  onClick={() => unhide.mutate(p.profileId)}
                  disabled={unhide.isPending}
                  className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 hover:border-white/30"
                >
                  Réafficher
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
