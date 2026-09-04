"use client";

import { useEffect, useRef, useState } from "react";
import CameraPreview from "./CameraPreview";
import { MicIcon, PhoneOffIcon, VideoIcon } from "./icons";

type CallPhase = "requesting" | "ringing" | "connected" | "denied" | "ended";

/**
 * UI for POST /v1/video-call. This is a local-preview-only demo: it shows
 * your own camera and a fake "ringing → connected" sequence, but there is no
 * real peer connection — that needs a signaling server + WebRTC/SFU on your
 * backend, which is out of scope for a frontend prototype.
 */
export default function VideoCallOverlay({
  displayName,
  onEnd,
}: {
  displayName: string;
  onEnd: () => void;
}) {
  const [phase, setPhase] = useState<CallPhase>("requesting");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        setStream(s);
        setPhase("ringing");
        setTimeout(() => !cancelled && setPhase("connected"), 1800);
      })
      .catch(() => setPhase("denied"));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (phase !== "connected") return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  function toggleMute() {
    setMuted((m) => {
      streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = m));
      return !m;
    });
  }

  function toggleCamera() {
    setCameraOff((c) => {
      streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = c));
      return !c;
    });
  }

  function hangUp() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPhase("ended");
    onEnd();
  }

  const time = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, "0")}`;

  return (
    <div className="overlay-fade-in fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1">
        {stream && !cameraOff ? (
          <CameraPreview stream={stream} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/40">
            <VideoIcon className="h-12 w-12" />
          </div>
        )}

        <div className="absolute left-0 right-0 top-0 px-4 py-4 text-center text-white">
          <p className="text-lg font-medium">{displayName}</p>
          <p className="mt-1 text-sm text-white/60">
            {phase === "requesting" && "Préparation de la caméra…"}
            {phase === "ringing" && "Appel en cours…"}
            {phase === "connected" && time}
            {phase === "denied" && "Caméra/micro refusés"}
          </p>
          <p className="mt-1 text-[11px] text-white/30">
            Démo locale — aucune vraie connexion pair-à-pair
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 bg-black/80 px-4 py-6">
        <button
          onClick={toggleMute}
          className={`rounded-full p-4 ${muted ? "bg-white text-black" : "bg-white/15 text-white"}`}
        >
          <MicIcon className="h-5 w-5" />
        </button>
        <button onClick={hangUp} className="rounded-full bg-red-500 p-5 text-white">
          <PhoneOffIcon className="h-6 w-6" />
        </button>
        <button
          onClick={toggleCamera}
          className={`rounded-full p-4 ${cameraOff ? "bg-white text-black" : "bg-white/15 text-white"}`}
        >
          <VideoIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
