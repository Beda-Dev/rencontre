"use client";

import { useState } from "react";
import Image from "next/image";
import { Message } from "@/lib/types";
import { useTranslateMessageMutation } from "@/lib/queries";
import { ClockIcon, TrashIcon } from "./icons";

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍"];
const EXPIRING_VIEW_MS = 8000;

function formatDuration(sec?: number) {
  if (!sec) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ExpiringImage({
  message,
  onViewed,
}: {
  message: Message;
  onViewed: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  if (message.viewed) {
    return (
      <div className="flex h-40 w-40 flex-col items-center justify-center gap-1 rounded-xl bg-white/5 text-white/30">
        <ClockIcon className="h-5 w-5" />
        <span className="text-[11px]">Photo vue</span>
      </div>
    );
  }

  if (!revealed) {
    return (
      <button
        onClick={() => {
          setRevealed(true);
          onViewed();
          setTimeout(() => setRevealed(false), EXPIRING_VIEW_MS);
        }}
        className="flex h-40 w-40 flex-col items-center justify-center gap-1 rounded-xl bg-white/10 text-white/70 hover:bg-white/15"
      >
        <ClockIcon className="h-6 w-6" />
        <span className="text-[11px]">Photo à durée limitée</span>
        <span className="text-[10px] text-white/40">Toucher pour voir</span>
      </button>
    );
  }

  return (
    <div className="relative h-40 w-40 overflow-hidden rounded-xl bg-black/20">
      <Image
        src={message.media?.url ?? ""}
        alt="Photo à durée limitée"
        fill
        unoptimized
        className="object-cover"
      />
    </div>
  );
}

function MessageContent({
  message,
  onViewExpiring,
}: {
  message: Message;
  onViewExpiring: () => void;
}) {
  if (message.expiring && message.type === "image") {
    return <ExpiringImage message={message} onViewed={onViewExpiring} />;
  }
  if (message.type === "image" || message.type === "gif") {
    return (
      <div className="relative h-48 w-48 overflow-hidden rounded-xl bg-black/20">
        <Image
          src={message.media?.url ?? ""}
          alt={message.type === "gif" ? "GIF" : "Photo"}
          fill
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }
  if (message.type === "audio") {
    return (
      <div className="flex items-center gap-2 py-1">
        <audio controls src={message.media?.url} className="h-9 max-w-[220px]" />
        <span className="text-[11px] text-white/50">
          {formatDuration(message.media?.length)}
        </span>
      </div>
    );
  }
  if (message.type === "video") {
    return (
      <video
        controls
        loop={message.media?.looping}
        src={message.media?.url}
        className="max-h-64 max-w-[240px] rounded-xl bg-black"
      />
    );
  }
  return <p className="whitespace-pre-wrap break-words">{message.body}</p>;
}

export default function ChatBubble({
  message,
  mine,
  onReact,
  onUnsend,
  onViewExpiring,
}: {
  message: Message;
  mine: boolean;
  onReact: (emoji: string) => void;
  onUnsend: () => void;
  onViewExpiring: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const translateMessage = useTranslateMessageMutation();
  const isMedia = message.type !== "text";
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleTranslate() {
    if (translated) {
      setTranslated(null);
      return;
    }
    try {
      const text = await translateMessage.mutateAsync({ body: message.body });
      setTranslated(text);
    } catch {
      setTranslated("Traduction indisponible pour le moment.");
    }
  }

  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div className="group relative flex items-center gap-1.5">
        {mine && (
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="rounded-full p-1 text-xs text-white/30 opacity-0 transition group-hover:opacity-100 hover:text-white/70"
            title="Réagir"
          >
            🙂
          </button>
        )}
        <div
          onDoubleClick={() => setPickerOpen((v) => !v)}
          className={
            message.unsent
              ? "max-w-[75%] rounded-2xl border border-white/10 bg-transparent px-3.5 py-2 text-sm italic text-white/40"
              : isMedia
                ? "overflow-hidden rounded-2xl"
                : `max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "rounded-br-sm bg-blue-400 text-black"
                      : "rounded-bl-sm bg-white/10 text-white"
                  }`
          }
        >
          {message.unsent ? (
            <p>Ce message a été supprimé.</p>
          ) : (
            <MessageContent message={message} onViewExpiring={onViewExpiring} />
          )}
          {!message.unsent && !isMedia && (
            <p
              className={`mt-1 text-right text-[10px] ${
                mine ? "text-black/60" : "text-white/40"
              }`}
            >
              {time}
            </p>
          )}
        </div>
        {!mine && (
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="rounded-full p-1 text-xs text-white/30 opacity-0 transition group-hover:opacity-100 hover:text-white/70"
            title="Réagir"
          >
            🙂
          </button>
        )}
        {mine && !message.unsent && (
          <button
            onClick={onUnsend}
            className="rounded-full p-1 text-white/20 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
            title="Annuler l'envoi"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isMedia && !message.unsent && (
        <p className={`mt-0.5 text-[10px] text-white/40`}>{time}</p>
      )}

      {!isMedia && !message.unsent && (
        <button
          onClick={handleTranslate}
          disabled={translateMessage.isPending}
          className="mt-0.5 text-[10px] text-white/30 transition hover:text-white/60"
        >
          {translateMessage.isPending
            ? "Traduction…"
            : translated
              ? "Masquer la traduction"
              : "Traduire"}
        </button>
      )}
      {translated && <p className="mt-0.5 max-w-[75%] text-xs italic text-white/60">{translated}</p>}

      {pickerOpen && (
        <div className="mt-1 flex gap-1 rounded-full border border-white/10 bg-[#1c1c1f] px-2 py-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact(message.reaction === emoji ? "" : emoji);
                setPickerOpen(false);
              }}
              className={`rounded-full p-1 text-sm hover:bg-white/10 ${
                message.reaction === emoji ? "bg-white/10" : ""
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {message.reaction && (
        <span className="-mt-1 rounded-full bg-[#1c1c1f] px-1.5 text-xs ring-2 ring-[#0b0b0c]">
          {message.reaction}
        </span>
      )}
    </div>
  );
}
