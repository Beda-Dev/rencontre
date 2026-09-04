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
  useConversationsQuery,
  useDeleteConversationMutation,
  useMarkConversationReadMutation,
  useMarkExpiringImageViewedMutation,
  useMessagesQuery,
  useProfileQuery,
  useReactToMessageMutation,
  useReportProfileMutation,
  useSendAudioMessageMutation,
  useSendGifMessageMutation,
  useSendImageMessageMutation,
  useSendMessageMutation,
  useSendVideoMessageMutation,
  useSetConversationMutedMutation,
  useSetConversationPinnedMutation,
  useUnsendMessageMutation,
} from "@/lib/queries";
import { Message } from "@/lib/types";
import { useMediaRecorder } from "@/lib/useMediaRecorder";
import { ai, toChatMessages, toProfileContext } from "@/lib/ai";
import { getAiSettings } from "@/lib/aiSettings";
import type { AiScamResult, AiTone } from "@/lib/aiTypes";
import ChatBubble from "@/components/ChatBubble";
import ChatMenu from "@/components/ChatMenu";
import GifPicker from "@/components/GifPicker";
import PhrasesBar from "@/components/PhrasesBar";
import SharedMediaSheet from "@/components/SharedMediaSheet";
import ImageViewer from "@/components/ImageViewer";
import CameraPreview from "@/components/CameraPreview";
import VideoCallOverlay from "@/components/VideoCallOverlay";
import AiSuggestionsSheet from "@/components/AiSuggestionsSheet";
import AiSummarySheet from "@/components/AiSummarySheet";
import ScamWarningBanner from "@/components/ScamWarningBanner";
import {
  BackIcon,
  BlockIcon,
  CameraIcon,
  ClockIcon,
  CloseIcon,
  GifIcon,
  MicIcon,
  PhoneIcon,
  SendIcon,
  SparkleIcon,
  VideoIcon,
} from "@/components/icons";

const ME_ID = "1";

export default function ChatThreadPage(props: PageProps<"/chat/[id]">) {
  const { id } = use(props.params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: profile } = useProfileQuery(id);
  const { data: messages } = useMessagesQuery(id);
  const { data: conversations } = useConversationsQuery();
  const conversation = conversations?.find((c) => c.profileId === id);
  const sendMessage = useSendMessageMutation(id);
  const sendImage = useSendImageMessageMutation(id);
  const sendGif = useSendGifMessageMutation(id);
  const sendAudio = useSendAudioMessageMutation(id);
  const sendVideo = useSendVideoMessageMutation(id);
  const reactToMessage = useReactToMessageMutation(id);
  const unsendMessage = useUnsendMessageMutation(id);
  const blockUser = useBlockUserMutation();
  const markRead = useMarkConversationReadMutation();
  const markExpiringViewed = useMarkExpiringImageViewedMutation(id);
  const setMuted = useSetConversationMutedMutation();
  const setPinned = useSetConversationPinnedMutation();
  const deleteConversation = useDeleteConversationMutation();
  const reportProfile = useReportProfileMutation();
  const [draft, setDraft] = useState("");
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [expiringNext, setExpiringNext] = useState(false);
  const [sharedMediaOpen, setSharedMediaOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const aiSettings = getAiSettings();
  const [aiTone, setAiTone] = useState<AiTone>(aiSettings.tone);
  const [aiSuggestOpen, setAiSuggestOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<{
    loading: boolean;
    error: string | null;
    summary: string | null;
    facts: string[];
  } | null>(null);
  const [scamResult, setScamResult] = useState<AiScamResult | null>(null);
  const scamCheckedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRecorder = useMediaRecorder("audio");
  const videoRecorder = useMediaRecorder("video");

  const sharedImages = (messages ?? [])
    .filter((m) => m.type === "image" && m.media && !m.unsent && !m.expiring)
    .map((m) => m.media!.url);

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

  // Opening a thread marks it read (POST /v4/chat/conversation/{id}/read/{messageId}).
  useEffect(() => {
    markRead.mutate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    scamCheckedRef.current = false;
    // Intentional: resets AI scam-check state when switching threads (the
    // component instance is reused across the dynamic [id] route param).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScamResult(null);
  }, [id]);

  // Automatic scam check, opt-in, runs once per thread once there's enough
  // to analyze — never blocks sending, purely informational.
  useEffect(() => {
    if (!aiSettings.enabled || !aiSettings.scamCheck || !aiSettings.autoScamCheck) return;
    if (scamCheckedRef.current || !messages || messages.length < 2) return;
    scamCheckedRef.current = true;
    ai.scamCheck(toChatMessages(messages, ME_ID))
      .then((res) => {
        if (res.risk !== "none") setScamResult(res);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  async function handleSummarize() {
    setAiSummary({ loading: true, error: null, summary: null, facts: [] });
    try {
      const res = await ai.conversationSummary(toChatMessages(messages ?? [], ME_ID));
      setAiSummary({ loading: false, error: null, summary: res.summary, facts: res.facts });
    } catch (err) {
      setAiSummary({
        loading: false,
        error: err instanceof Error ? err.message : "Erreur inconnue.",
        summary: null,
        facts: [],
      });
    }
  }

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
    if (file) {
      await sendImage.mutateAsync({ file, expiring: expiringNext });
      setExpiringNext(false);
    }
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

  async function handleReport() {
    if (!profile) return;
    if (!window.confirm(`Signaler ${profile.displayName ?? "ce profil"} ?`)) return;
    await reportProfile.mutateAsync({ profileId: profile.profileId, reason: 3, comment: "Spam" });
    window.alert("Signalement envoyé.");
  }

  async function handleDeleteConversation() {
    if (!window.confirm("Supprimer cette conversation ?")) return;
    await deleteConversation.mutateAsync(id);
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
            <ChatMenu
              muted={conversation?.muted ?? false}
              pinned={conversation?.pinned ?? false}
              onToggleMute={() =>
                setMuted.mutate({ profileId: id, muted: !(conversation?.muted ?? false) })
              }
              onTogglePin={() =>
                setPinned.mutate({ profileId: id, pinned: !(conversation?.pinned ?? false) })
              }
              onDelete={handleDeleteConversation}
              onReport={handleReport}
              onSharedMedia={() => setSharedMediaOpen(true)}
              onSummarize={
                aiSettings.enabled && aiSettings.conversationSummary ? handleSummarize : undefined
              }
            />
          </>
        )}
      </header>

      {scamResult && scamResult.risk !== "none" && (
        <ScamWarningBanner
          risk={scamResult.risk}
          reasons={scamResult.reasons}
          onDismiss={() => setScamResult(null)}
        />
      )}

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
            onViewExpiring={() => markExpiringViewed.mutate(m.messageId)}
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

      <PhrasesBar onPick={(text) => sendMessage.mutate(text)} />

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
            {aiSettings.enabled && (aiSettings.replySuggestions || aiSettings.icebreaker) && (
              <button
                type="button"
                onClick={() => setAiSuggestOpen(true)}
                className="shrink-0 rounded-full p-2 text-white/60 hover:text-blue-400"
                title="Suggestions IA"
              >
                <SparkleIcon className="h-5 w-5" />
              </button>
            )}
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
              onClick={() => setExpiringNext((v) => !v)}
              title={expiringNext ? "Prochaine photo : durée limitée (activé)" : "Rendre la prochaine photo éphémère"}
              className={`shrink-0 rounded-full p-2 ${
                expiringNext ? "bg-blue-400 text-black" : "text-white/60 hover:text-blue-400"
              }`}
            >
              <ClockIcon className="h-5 w-5" />
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

      {sharedMediaOpen && (
        <SharedMediaSheet
          profileId={id}
          onClose={() => setSharedMediaOpen(false)}
          onOpenImage={(i) => setViewerIndex(i)}
        />
      )}

      {viewerIndex !== null && (
        <ImageViewer
          urls={sharedImages}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {aiSuggestOpen && profile && (
        <AiSuggestionsSheet
          title={
            (messages ?? []).length === 0 ? "Premier message" : "Suggestions de réponse"
          }
          tone={aiTone}
          onToneChange={setAiTone}
          onGenerate={async (tone) => {
            const ctx = toProfileContext(profile);
            const res =
              (messages ?? []).length === 0
                ? await ai.icebreaker(ctx, tone)
                : await ai.replySuggestions(toChatMessages(messages ?? [], ME_ID), ctx, tone);
            return res.suggestions;
          }}
          onPick={(text) => setDraft(text)}
          onClose={() => setAiSuggestOpen(false)}
        />
      )}

      {aiSummary && (
        <AiSummarySheet
          loading={aiSummary.loading}
          error={aiSummary.error}
          summary={aiSummary.summary}
          facts={aiSummary.facts}
          onClose={() => setAiSummary(null)}
        />
      )}
    </div>
  );
}
