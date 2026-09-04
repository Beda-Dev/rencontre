"use client";

import { FormEvent, use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { mediaUrl } from "@/lib/api";
import { connectConversation } from "@/lib/realtime";
import {
  queryKeys,
  useBlockUserMutation,
  useMessagesQuery,
  useProfileQuery,
  useReactToMessageMutation,
  useSendAudioMessageMutation,
  useSendGifMessageMutation,
  useSendImageMessageMutation,
  useSendMessageMutation,
  useSendVideoMessageMutation,
  useUnsendMessageMutation,
} from "@/lib/queries";
import { Message } from "@/lib/types";
import { useMediaRecorder } from "@/lib/useMediaRecorder";
import ChatBubble from "@/components/ChatBubble";
import GifPicker from "@/components/GifPicker";
import CameraPreview from "@/components/CameraPreview";
import VideoCallOverlay from "@/components/VideoCallOverlay";
import {
  BackIcon,
  BlockIcon,
  CameraIcon,
  CloseIcon,
  GifIcon,
  MicIcon,
  PhoneIcon,
  SendIcon,
  VideoIcon,
} from "@/components/icons";

const ME_ID = "1";

export default function ChatThreadPage(props: PageProps<"/chat/[id]">) {
  const { id } = use(props.params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: profile } = useProfileQuery(id);
  const { data: messages } = useMessagesQuery(id);
  const sendMessage = useSendMessageMutation(id);
  const sendImage = useSendImageMessageMutation(id);
  const sendGif = useSendGifMessageMutation(id);
  const sendAudio = useSendAudioMessageMutation(id);
  const sendVideo = useSendVideoMessageMutation(id);
  const reactToMessage = useReactToMessageMutation(id);
  const unsendMessage = useUnsendMessageMutation(id);
  const blockUser = useBlockUserMutation();
  const [draft, setDraft] = useState("");
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [inCall, setInCall] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRecorder = useMediaRecorder("audio");
  const videoRecorder = useMediaRecorder("video");

  // Realtime: live incoming messages over the (mock or real) WebSocket layer,
  // merged straight into the query cache so the list re-renders like any
  // other cache update.
  useEffect(() => {
    const conn = connectConversation(id, (incoming: Message) => {
      qc.setQueryData<Message[]>(queryKeys.messages(id), (prev = []) => [
        ...prev,
        incoming,
      ]);
    });
    return () => conn.close();
  }, [id, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await sendMessage.mutateAsync(body);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await sendImage.mutateAsync(file);
  }

  async function handleStopAudio() {
    const blob = await audioRecorder.stop();
    if (blob) await sendAudio.mutateAsync([blob, audioRecorder.seconds]);
  }

  async function handleStopVideo() {
    const blob = await videoRecorder.stop();
    if (blob) await sendVideo.mutateAsync([blob, videoRecorder.seconds]);
  }

  async function handleBlock() {
    if (!profile) return;
    if (!window.confirm(`Bloquer ${profile.displayName ?? "ce profil"} ?`)) return;
    await blockUser.mutateAsync(profile.profileId);
    router.replace("/chat");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-[#141416]/95 px-3 py-2.5 backdrop-blur">
        <button onClick={() => router.back()} className="p-1">
          <BackIcon className="h-5 w-5" />
        </button>
        {profile && (
          <>
            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-white/10">
              <Image
                src={mediaUrl(profile.profileImageMediaHash, profile.displayName ?? undefined)}
                alt={profile.displayName ?? "Profil"}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <p className="min-w-0 flex-1 truncate font-medium">{profile.displayName ?? "—"}</p>
            <button
              onClick={() => setInCall(true)}
              title="Appel vidéo"
              className="p-1.5 text-white/50 hover:text-blue-400"
            >
              <PhoneIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleBlock}
              disabled={blockUser.isPending}
              title="Bloquer"
              className="p-1.5 text-white/50 hover:text-red-400 disabled:opacity-40"
            >
              <BlockIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {(messages ?? []).map((m) => (
          <ChatBubble
            key={m.messageId}
            message={m}
            mine={m.sourceProfileId === ME_ID}
            onReact={(emoji) =>
              reactToMessage.mutate({ messageId: m.messageId, emoji: emoji || null })
            }
            onUnsend={() => unsendMessage.mutate(m.messageId)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {videoRecorder.status === "recording" && (
        <div className="relative border-t border-white/10 bg-black px-3 py-3">
          <CameraPreview
            stream={videoRecorder.previewStream}
            className="h-40 w-full rounded-lg object-cover"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-red-400">● {videoRecorder.seconds}s</span>
            <div className="flex gap-2">
              <button
                onClick={videoRecorder.cancel}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleStopVideo}
                className="rounded-full bg-blue-400 px-3 py-1 text-xs font-medium text-black"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="sticky bottom-0 flex items-center gap-1.5 border-t border-white/10 bg-[#141416] px-2 py-2.5"
      >
        {gifPickerOpen && (
          <GifPicker
            onPick={(gif) => {
              sendGif.mutate([gif]);
              setGifPickerOpen(false);
            }}
            onClose={() => setGifPickerOpen(false)}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />

        {audioRecorder.status === "recording" ? (
          <div className="flex flex-1 items-center gap-2 rounded-full bg-white/5 px-3 py-2">
            <span className="text-xs text-red-400">● {audioRecorder.seconds}s</span>
            <span className="flex-1 text-xs text-white/50">Enregistrement…</span>
            <button
              type="button"
              onClick={audioRecorder.cancel}
              className="text-white/40 hover:text-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleStopAudio}
              className="rounded-full bg-blue-400 p-1.5 text-black"
            >
              <SendIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 rounded-full p-2 text-white/60 hover:text-blue-400"
              title="Envoyer une photo"
            >
              <CameraIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setGifPickerOpen((v) => !v)}
              className="shrink-0 rounded-full p-2 text-white/60 hover:text-blue-400"
              title="Envoyer un GIF"
            >
              <GifIcon className="h-5 w-5" />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message…"
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none focus:border-blue-400"
            />
            {draft.trim() ? (
              <button
                type="submit"
                disabled={sendMessage.isPending}
                className="shrink-0 rounded-full bg-blue-400 p-2.5 text-black disabled:opacity-40"
              >
                <SendIcon className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => videoRecorder.start()}
                  className="shrink-0 rounded-full p-2 text-white/60 hover:text-blue-400"
                  title="Message vidéo"
                >
                  <VideoIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => audioRecorder.start()}
                  className="shrink-0 rounded-full p-2 text-white/60 hover:text-blue-400"
                  title="Message vocal"
                >
                  <MicIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </>
        )}
      </form>

      {inCall && profile && (
        <VideoCallOverlay
          displayName={profile.displayName ?? "—"}
          onEnd={() => setInCall(false)}
        />
      )}
    </div>
  );
}
