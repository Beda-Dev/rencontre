import Link from "next/link";
import { PinFlameLogo } from "@/components/icons";

export const metadata = { title: "Politique de confidentialité — Meets" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/login" className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80">
        <PinFlameLogo className="h-5 w-5 text-blue-400" />
        Meets
      </Link>

      <h1 className="mt-6 text-2xl font-semibold">Politique de confidentialité</h1>
      <p className="mt-1 text-xs text-white/40">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-white/70">
        <p>
          <strong className="text-white">Meets</strong> est un prototype d&apos;interface
          de type application de rencontre, à but de démonstration/développement. Il
          n&apos;est affilié à aucun service commercial existant.
        </p>

        <section>
          <h2 className="mb-1 font-medium text-white">Mode démo (par défaut)</h2>
          <p>
            Par défaut, l&apos;application fonctionne entièrement avec des données
            fictives générées localement dans ton navigateur. Aucune information
            n&apos;est envoyée à un serveur : ni profils, ni messages, ni position, ni
            identifiants. Tout est stocké uniquement dans le stockage local
            (localStorage) de ton navigateur et supprimé si tu vides ce stockage.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-white">Mode &laquo;&nbsp;API réelle&nbsp;&raquo;</h2>
          <p>
            Si tu configures toi-même une URL de backend (dans les réglages de
            connexion), l&apos;application envoie tes requêtes à cette adresse — que tu
            contrôles et héberges toi-même. Nous n&apos;avons aucune visibilité sur ce
            que ce backend fait de ces données ; c&apos;est à toi, en tant
            qu&apos;opérateur de ce backend, de définir tes propres pratiques de
            confidentialité.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-white">Connexion avec Google</h2>
          <p>
            Si tu utilises &laquo;&nbsp;Continuer avec Google&nbsp;&raquo;, l&apos;application obtient un code
            d&apos;autorisation via le SDK officiel de Google (Google Identity
            Services). Ce code est transmis à ton propre backend configuré — jamais à
            un tiers autre que Google et ce backend. Nous ne stockons ni ne consultons
            aucune donnée de ton compte Google.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-white">Géolocalisation</h2>
          <p>
            Si tu actives la localisation, ta position n&apos;est utilisée que
            localement (calcul de distances factices) ou envoyée à ton backend
            configuré, jamais à un service tiers.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-white">Contact</h2>
          <p>Pour toute question, contacte l&apos;opérateur de ce déploiement.</p>
        </section>
      </div>
    </div>
  );
}
