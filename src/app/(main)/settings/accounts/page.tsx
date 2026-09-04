"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { BackIcon } from "@/components/icons";
import AccountRow from "@/components/AccountRow";
import { api } from "@/lib/api";
import {
  useAccountsQuery,
  useRemoveAccountMutation,
  useSwitchAccountMutation,
} from "@/lib/queries";

export default function AccountsPage() {
  const router = useRouter();
  const { data: accounts, isLoading } = useAccountsQuery();
  const switchAccount = useSwitchAccountMutation();
  const removeAccount = useRemoveAccountMutation();
  const activeId = api.getActiveAccountId();

  async function handleSwitch(profileId: string) {
    if (profileId === activeId) return;
    await switchAccount.mutateAsync(profileId);
    router.refresh();
  }

  function handleRemove(profileId: string) {
    if (!window.confirm("Retirer ce compte de cet appareil ?")) return;
    removeAccount.mutate(profileId);
    if (profileId === activeId) router.push("/login");
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <TopBar
        title="Comptes"
        right={
          <button onClick={() => router.back()} className="p-1">
            <BackIcon className="h-5 w-5" />
          </button>
        }
      />

      <div className="space-y-2 px-4 py-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-white/50">Chargement…</p>
        ) : !accounts || accounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/50">Aucun compte enregistré.</p>
        ) : (
          accounts.map((acc) => (
            <AccountRow
              key={acc.profileId}
              account={acc}
              active={acc.profileId === activeId}
              busy={switchAccount.isPending || removeAccount.isPending}
              onSelect={() => handleSwitch(acc.profileId)}
              onRemove={() => handleRemove(acc.profileId)}
            />
          ))
        )}

        <Link
          href="/login"
          className="block w-full rounded-lg border border-dashed border-white/15 py-2.5 text-center text-sm text-white/60 hover:border-white/30"
        >
          + Ajouter un compte
        </Link>
      </div>

      <p className="mx-4 text-xs text-white/30">
        Basculer entre comptes réutilise la session existante (authToken) sans
        redemander le mot de passe — comme sur WhatsApp ou Telegram. Rien n&apos;est
        envoyé nulle part au-delà de ton backend configuré.
      </p>
    </div>
  );
}
