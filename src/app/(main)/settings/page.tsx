"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { api, mediaUrl } from "@/lib/api";
import { AppConfig, getConfig } from "@/lib/config";
import {
  useMeQuery,
  useSetSpotifyFavoritesMutation,
  useSpotifyCatalogQuery,
  useSpotifyFavoritesQuery,
  useUpdateMeMutation,
  useUploadProfilePhotoMutation,
} from "@/lib/queries";
import { MyProfile } from "@/lib/types";
import {
  AppIconGlyph,
  BoltIcon,
  CameraIcon,
  EyeIcon,
  LockIcon,
  MusicIcon,
  PinIcon,
  PlugIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";

export default function SettingsPage() {
  const router = useRouter();
  const { data: me, isLoading } = useMeQuery();
  const updateMe = useUpdateMeMutation();
  const uploadPhoto = useUploadProfilePhotoMutation();
  const [draft, setDraft] = useState<MyProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [config, setConfigState] = useState<AppConfig | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: myTracks } = useSpotifyFavoritesQuery(me?.profileId ?? "");
  const { data: catalog } = useSpotifyCatalogQuery();
  const setSpotifyFavorites = useSetSpotifyFavoritesMutation(me?.profileId ?? "");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me && !draft) setDraft(me);
  }, [me, draft]);

  useEffect(() => {
    // Intentional: reads localStorage, so this must run client-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfigState(getConfig());
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setSaved(false);
    await updateMe.mutateAsync(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLogout() {
    api.logout();
    router.push("/login");
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !draft) return;
    const url = await uploadPhoto.mutateAsync(file);
    setDraft({ ...draft, profileImageMediaHash: url });
  }

  function toggleTrack(trackId: string) {
    if (!catalog) return;
    const track = catalog.find((t) => t.id === trackId);
    if (!track) return;
    const current = myTracks ?? [];
    const has = current.some((t) => t.id === trackId);
    const next = has
      ? current.filter((t) => t.id !== trackId)
      : [...current, track].slice(0, 5);
    setSpotifyFavorites.mutate(next);
  }

  if (isLoading || !draft) {
    return <p className="px-4 py-10 text-center text-sm text-white/50">Chargement…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <TopBar title="Réglages" />

      <div className="flex flex-col items-center gap-2 px-4 py-6">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadPhoto.isPending}
          className="group relative h-20 w-20 overflow-hidden rounded-full bg-white/10"
        >
          <Image
            src={mediaUrl(draft.profileImageMediaHash, draft.displayName)}
            alt={draft.displayName}
            fill
            unoptimized
            className="object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/50 group-hover:opacity-100">
            <CameraIcon className="h-5 w-5 text-white" />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handlePhotoChange}
        />
        <p className="text-xs text-white/40">
          {uploadPhoto.isPending ? "Envoi…" : "Toucher la photo pour la changer"}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 px-4 pb-6">
        <div>
          <label className="mb-1 block text-xs text-white/60">Nom affiché</label>
          <input
            value={draft.displayName}
            onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/60">À propos</label>
          <textarea
            rows={3}
            value={draft.aboutMe}
            onChange={(e) => setDraft({ ...draft, aboutMe: e.target.value })}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5">
          <span className="text-sm">Afficher mon âge</span>
          <input
            type="checkbox"
            checked={draft.showAge}
            onChange={(e) => setDraft({ ...draft, showAge: e.target.checked })}
            className="h-4 w-4 accent-blue-400"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5">
          <span className="text-sm">Afficher ma distance</span>
          <input
            type="checkbox"
            checked={draft.showDistance}
            onChange={(e) => setDraft({ ...draft, showDistance: e.target.checked })}
            className="h-4 w-4 accent-blue-400"
          />
        </div>

        <button
          type="submit"
          disabled={updateMe.isPending}
          className="w-full rounded-lg bg-blue-400 py-2.5 text-sm font-semibold text-black hover:bg-blue-300 disabled:opacity-60"
        >
          {updateMe.isPending ? "Enregistrement…" : saved ? "Enregistré ✓" : "Enregistrer"}
        </button>
      </form>

      <div className="mx-4 mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-xs text-white/50">
          <MusicIcon className="h-3.5 w-3.5" />
          Titres favoris (max 5, affichés sur ton profil)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(catalog ?? []).map((track) => {
            const active = (myTracks ?? []).some((t) => t.id === track.id);
            return (
              <button
                key={track.id}
                onClick={() => toggleTrack(track.id)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  active
                    ? "border-blue-400 bg-blue-400/10 text-blue-400"
                    : "border-white/15 text-white/60 hover:border-white/30"
                }`}
              >
                {track.title} — {track.artist}
              </button>
            );
          })}
        </div>
      </div>

      <Link
        href="/settings/accounts"
        className="mx-4 mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-sm hover:border-white/20"
      >
        <span className="flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-blue-400" />
          Comptes
        </span>
        <span className="text-xs text-white/50">Basculer</span>
      </Link>

      <Link
        href="/settings/boost"
        className="mx-4 mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-sm hover:border-white/20"
      >
        <span className="flex items-center gap-2">
          <BoltIcon className="h-4 w-4 text-blue-400" />
          Boost
        </span>
        <span className="text-xs text-white/50">Visibilité</span>
      </Link>

      <Link
        href="/settings/location"
        className="mx-4 mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-sm hover:border-white/20"
      >
        <span className="flex items-center gap-2">
          <PinIcon className="h-4 w-4 text-blue-400" />
          Localisation
        </span>
        <span className="text-xs text-white/50">GPS · Roam</span>
      </Link>

      <Link
        href="/settings/account"
        className="mx-4 mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-sm hover:border-white/20"
      >
        <span className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-blue-400" />
          Compte
        </span>
        <span className="text-xs text-white/50">Email · mot de passe</span>
      </Link>

      <Link
        href="/settings/privacy"
        className="mx-4 mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-sm hover:border-white/20"
      >
        <span className="flex items-center gap-2">
          <EyeIcon className="h-4 w-4 text-blue-400" />
          Confidentialité
        </span>
        <span className="text-xs text-white/50">Bloqués · masqués</span>
      </Link>

      <Link
        href="/settings/security"
        className="mx-4 mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-sm hover:border-white/20"
      >
        <span className="flex items-center gap-2">
          <LockIcon className="h-4 w-4 text-blue-400" />
          Sécurité
        </span>
        <span className="text-xs text-white/50">Verrouillage</span>
      </Link>

      <Link
        href="/settings/appearance"
        className="mx-4 mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-sm hover:border-white/20"
      >
        <span className="flex items-center gap-2">
          <AppIconGlyph className="h-4 w-4 text-blue-400" />
          Apparence
        </span>
        <span className="text-xs text-white/50">Icône discrète</span>
      </Link>

      <Link
        href="/settings/connection"
        className="mx-4 mb-6 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-sm hover:border-white/20"
      >
        <span className="flex items-center gap-2">
          <PlugIcon className="h-4 w-4 text-blue-400" />
          Connexion API
        </span>
        <span className="text-xs text-white/50">
          {config ? (config.useMock ? "Mock" : "Réelle") : "…"}
        </span>
      </Link>

      <button
        onClick={handleLogout}
        className="mx-4 mb-8 rounded-lg border border-red-400/40 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10"
      >
        Se déconnecter
      </button>
    </div>
  );
}
