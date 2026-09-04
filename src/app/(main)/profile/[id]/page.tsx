"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, mediaUrl } from "@/lib/api";
import {
  useBlockUserMutation,
  useHideProfileMutation,
  useManagedFieldsQuery,
  useProfileQuery,
  useReportProfileMutation,
  useSetFavoriteNoteMutation,
  useSpotifyFavoritesQuery,
  useToggleFavoriteMutation,
} from "@/lib/queries";
import { ManagedFields } from "@/lib/types";
import { formatLastSeen } from "@/lib/format";
import {
  BackIcon,
  BlockIcon,
  ChatIcon,
  EyeIcon,
  FlagIcon,
  MusicIcon,
  StarIcon,
} from "@/components/icons";
import ImageViewer from "@/components/ImageViewer";

function fieldName(fields: ManagedFields[keyof ManagedFields], id: number | null) {
  if (id === null) return null;
  return fields.find((f) => f.fieldId === id)?.name ?? null;
}

export default function ProfileDetailPage(props: PageProps<"/profile/[id]">) {
  const { id } = use(props.params);
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfileQuery(id);
  const { data: fields, isLoading: fieldsLoading } = useManagedFieldsQuery();
  const toggleFavorite = useToggleFavoriteMutation();
  const setFavoriteNote = useSetFavoriteNoteMutation();
  const blockUser = useBlockUserMutation();
  const hideProfile = useHideProfileMutation();
  const reportProfile = useReportProfileMutation();
  const { data: tracks } = useSpotifyFavoritesQuery(id);
  const [blocked, setBlocked] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (profileLoading || fieldsLoading || !profile || !fields) {
    return <p className="px-4 py-10 text-center text-sm text-white/50">Chargement…</p>;
  }

  if (blocked || hidden) {
    return (
      <p className="px-4 py-10 text-center text-sm text-white/50">
        {blocked ? "Profil bloqué." : "Profil masqué."} Retour à la grille…
      </p>
    );
  }

  async function handleBlock() {
    if (!window.confirm(`Bloquer ${profile!.displayName ?? "ce profil"} ?`)) return;
    await blockUser.mutateAsync(profile!.profileId);
    setBlocked(true);
    setTimeout(() => router.push("/"), 900);
  }

  async function handleHide() {
    await hideProfile.mutateAsync(profile!.profileId);
    setHidden(true);
    setTimeout(() => router.push("/"), 900);
  }

  async function handleReport() {
    if (!window.confirm(`Signaler ${profile!.displayName ?? "ce profil"} ?`)) return;
    await reportProfile.mutateAsync({ profileId: profile!.profileId, reason: 3, comment: "Spam" });
    window.alert("Signalement envoyé.");
  }

  const photoHashes = [
    profile.profileImageMediaHash,
    ...profile.albumImageMediaHashes,
  ].filter((h): h is string => Boolean(h));
  const photos = photoHashes.map((h) => mediaUrl(h, profile.displayName ?? undefined));

  function openAlbum(index: number) {
    setViewerIndex(index);
    api.recordAlbumView(profile!.profileId);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative aspect-square w-full bg-white/5 sm:rounded-b-xl">
        <button
          onClick={() => openAlbum(0)}
          className="absolute inset-0 h-full w-full"
          aria-label="Voir la photo en plein écran"
        >
          <Image
            src={photos[0]}
            alt={profile.displayName ?? "Profil"}
            fill
            unoptimized
            className="object-cover sm:rounded-b-xl"
          />
        </button>
        <button
          onClick={() => router.back()}
          className="absolute left-3 top-3 rounded-full bg-black/50 p-2 backdrop-blur"
        >
          <BackIcon className="h-5 w-5" />
        </button>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 sm:rounded-b-xl">
          <h1 className="text-xl font-semibold">
            {profile.displayName ?? "—"}
            {profile.showAge && profile.age ? `, ${profile.age}` : ""}
          </h1>
          <p className="text-sm text-white/70">
            {profile.showDistance && profile.distance !== null
              ? `${(profile.distance / 1000).toFixed(1)} km`
              : profile.online
                ? "En ligne"
                : formatLastSeen(profile.seen)}
          </p>
        </div>
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {photos.map((url, i) => (
            <button
              key={photoHashes[i] ?? i}
              onClick={() => openAlbum(i)}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white/5"
            >
              <Image src={url} alt={`Photo ${i + 1}`} fill unoptimized className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 px-4 py-3">
        <button
          onClick={() =>
            toggleFavorite.mutate({ profileId: profile.profileId, favorite: !profile.isFavorite })
          }
          disabled={toggleFavorite.isPending}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition ${
            profile.isFavorite
              ? "border-blue-400 bg-blue-400/10 text-blue-400"
              : "border-white/15 text-white/80 hover:border-white/30"
          }`}
        >
          <StarIcon className="h-4 w-4" filled={profile.isFavorite} />
          {profile.isFavorite ? "Favori" : "Ajouter aux favoris"}
        </button>
        <Link
          href={`/chat/${profile.profileId}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-400 py-2.5 text-sm font-medium text-black hover:bg-blue-300"
        >
          <ChatIcon className="h-4 w-4" />
          Discuter
        </Link>
      </div>

      {profile.aboutMe && (
        <p className="px-4 pb-4 text-sm text-white/80">{profile.aboutMe}</p>
      )}

      {tracks && tracks.length > 0 && (
        <div className="px-4 pb-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs text-white/40">
            <MusicIcon className="h-3.5 w-3.5" />
            Titres favoris
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tracks.map((t) => (
              <span
                key={t.id}
                className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/70"
              >
                {t.title} — {t.artist}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.isFavorite && (
        <div className="px-4 pb-4">
          <label className="mb-1 block text-xs text-white/40">Note privée</label>
          <textarea
            rows={2}
            defaultValue={profile.favoriteNote ?? ""}
            onBlur={(e) =>
              setFavoriteNote.mutate({ profileId: profile.profileId, note: e.target.value })
            }
            placeholder="Ex : rencontré au bar du centre-ville…"
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 pb-4 text-sm">
        <Field label="Recherche" value={profile.lookingFor.map((v) => fieldName(fields.lookingFor, v)).filter(Boolean).join(", ")} />
        <Field label="Statut" value={fieldName(fields.relationshipStatus, profile.relationshipStatus)} />
        <Field label="Silhouette" value={fieldName(fields.bodyType, profile.bodyType)} />
        <Field label="Origine" value={fieldName(fields.ethnicity, profile.ethnicity)} />
        <Field label="Tribus" value={profile.grindrTribes.map((v) => fieldName(fields.grindrTribes, v)).filter(Boolean).join(", ")} />
        <Field label="Taille" value={profile.height > 0 ? `${profile.height} cm` : null} />
      </dl>

      <div className="mx-4 mb-8 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleHide}
            disabled={hideProfile.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 py-2.5 text-sm text-white/70 hover:border-white/30 disabled:opacity-50"
          >
            <EyeIcon className="h-4 w-4" />
            Masquer
          </button>
          <button
            onClick={handleReport}
            disabled={reportProfile.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-orange-400/30 py-2.5 text-sm text-orange-300 hover:bg-orange-400/10 disabled:opacity-50"
          >
            <FlagIcon className="h-4 w-4" />
            Signaler
          </button>
        </div>
        <button
          onClick={handleBlock}
          disabled={blockUser.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 py-2.5 text-sm text-red-400 hover:bg-red-400/10 disabled:opacity-50"
        >
          <BlockIcon className="h-4 w-4" />
          Bloquer
        </button>
      </div>

      {viewerIndex !== null && (
        <ImageViewer
          urls={photos}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/40">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
