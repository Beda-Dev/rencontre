"use client";

import Image from "next/image";
import { mediaUrl } from "@/lib/api";
import { SavedAccount } from "@/lib/accounts";

export default function AccountRow({
  account,
  active,
  busy,
  onSelect,
  onRemove,
}: {
  account: SavedAccount;
  active?: boolean;
  busy?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
        active ? "border-amber-400/40 bg-amber-400/10" : "border-white/10 bg-white/5"
      }`}
    >
      <button
        onClick={onSelect}
        disabled={busy || active}
        className="flex flex-1 items-center gap-3 text-left disabled:cursor-default"
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10">
          <Image
            src={mediaUrl(account.profileImageMediaHash, account.displayName)}
            alt={account.displayName}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{account.displayName}</p>
          <p className="truncate text-xs text-white/40">{account.email}</p>
        </div>
        {active && (
          <span className="shrink-0 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-medium text-black">
            Actif
          </span>
        )}
      </button>
      {onRemove && (
        <button
          onClick={onRemove}
          disabled={busy}
          className="shrink-0 px-1.5 py-1 text-xs text-white/30 hover:text-red-400"
          title="Retirer de cet appareil"
        >
          Retirer
        </button>
      )}
    </div>
  );
}
