import Link from "next/link";
import { PinFlameLogo } from "@/components/icons";

export const metadata = { title: "Conditions d'utilisation — Rencontre" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/login" className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80">
        <PinFlameLogo className="h-5 w-5 text-blue-400" />
        Rencontre
      </Link>

      <h1 className="mt-6 text-2xl font-semibold">Conditions d&apos;utilisation</h1>
      <p className="mt-1 text-xs text-white/40">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-white/70">
        <p>
          <strong className="text-white">Rencontre</strong> est un prototype logiciel
          fourni à but de démonstration et de développement, "tel quel", sans garantie
          d&apos;aucune sorte.
        </p>

        <section>
          <h2 className="mb-1 font-medium text-white">Utilisation</h2>
          <p>
            En mode démo, toutes les données affichées (profils, messages, photos)
            sont fictives et générées automatiquement — elles ne représentent aucune
            personne réelle. En mode "API réelle", l&apos;application se comporte
            comme un simple client pour le backend que tu configures et contrôles
            toi-même ; les présentes conditions ne couvrent pas ce backend.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-white">Âge minimum</h2>
          <p>Cette application n&apos;est pas destinée aux mineurs.</p>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-white">Aucune affiliation</h2>
          <p>
            Ce projet est un prototype indépendant. Il n&apos;est affilié à, associé
            à, ni approuvé par aucun service de rencontre commercial existant.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-white">Limitation de responsabilité</h2>
          <p>
            Le logiciel est fourni sans garantie. L&apos;opérateur de ce déploiement
            décline toute responsabilité quant à l&apos;usage qui en est fait,
            notamment via un backend tiers configuré par l&apos;utilisateur.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-white">Modifications</h2>
          <p>Ces conditions peuvent être mises à jour à tout moment.</p>
        </section>
      </div>
    </div>
  );
}
