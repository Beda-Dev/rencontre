"use client";

import { useState } from "react";
import { FlagIcon, ImagesIcon, MoreIcon, MuteIcon, PinFilledIcon, TrashIcon } from "./icons";

export default function ChatMenu({
  muted,
  pinned,
  onToggleMute,
  onTogglePin,
  onDelete,
  onReport,
  onSharedMedia,
}: {
  muted: boolean;
  pinned: boolean;
  onToggleMute: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onReport: () => void;
  onSharedMedia: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-white/50 hover:text-white/90"
        title="Plus d'options"
      >
        <MoreIcon className="h-5 w-5" />
      </button>
      {open && (
        <>
          <button
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
          />
          <div className="overlay-pop-in absolute right-0 top-full z-40 mt-1 w-56 rounded-xl border border-white/10 bg-[#1c1c1f] p-1 text-sm shadow-xl">
            <button
              onClick={() => {
                onTogglePin();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/5"
            >
              <PinFilledIcon className="h-4 w-4 text-white/60" />
              {pinned ? "Détacher" : "Épingler"}
            </button>
            <button
              onClick={() => {
                onToggleMute();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/5"
            >
              <MuteIcon className="h-4 w-4 text-white/60" />
              {muted ? "Réactiver les notifications" : "Couper les notifications"}
            </button>
            <button
              onClick={() => {
                onSharedMedia();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/5"
            >
              <ImagesIcon className="h-4 w-4 text-white/60" />
              Médias partagés
            </button>
            <button
              onClick={() => {
                onReport();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-orange-300 hover:bg-white/5"
            >
              <FlagIcon className="h-4 w-4" />
              Signaler
            </button>
            <button
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-400 hover:bg-white/5"
            >
              <TrashIcon className="h-4 w-4" />
              Supprimer la conversation
            </button>
          </div>
        </>
      )}
    </div>
  );
}
