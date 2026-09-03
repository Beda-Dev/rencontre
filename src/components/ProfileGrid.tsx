import { Profile } from "@/lib/types";
import ProfileCard from "./ProfileCard";

export default function ProfileGrid({
  profiles,
  emptyLabel = "Personne à afficher pour le moment.",
}: {
  profiles: Profile[];
  emptyLabel?: string;
}) {
  if (profiles.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-white/50">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 p-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {profiles.map((p) => (
        <ProfileCard key={p.profileId} profile={p} />
      ))}
    </div>
  );
}
