import type { AiChatMessage, AiProfileContext, AiTone } from "./aiTypes";

export const TONE_HINT: Record<AiTone, string> = {
  naturel:
    "Naturel : comme un message à quelqu'un que tu trouves sympa. Détendu, sans effort apparent, zéro formule toute faite.",
  drole:
    "Drôle : une pointe d'auto-dérision ou une observation absurde. L'humour doit naître d'un détail réel de la conversation, jamais d'une blague plaquée.",
  direct:
    "Direct : tu dis ce que tu veux sans tourner autour du pot, en une phrase. Assumé, pas agressif, pas insistant.",
  flirt:
    "Flirt : sous-entendu léger, complicité, jamais explicite ni sur le physique. La tension vient du ton, pas du vocabulaire.",
};

/** Rules every generated message must respect — the main quality lever. */
const WRITING_RULES = [
  "Écris dans la langue dominante de la conversation ou du profil (français par défaut).",
  "Une seule idée par message. Pas de pavé, pas de double question.",
  "Zéro formule d'ouverture creuse : « Salut, ça va ? », « Tu fais quoi ? », « Belle photo », « T'es mignon », « Quoi de neuf ».",
  "Zéro emoji sauf si l'autre personne en utilise déjà, et alors un seul maximum.",
  "Pas de superlatifs vides (incroyable, magnifique, parfait) ni de compliments génériques sur le physique.",
  "Accroche-toi à un détail concret et vérifiable (un mot de sa bio, un morceau, une chose qu'il a dite). Si tu ne peux citer aucun détail, écris un message qui ouvre un sujet précis plutôt qu'un message passe-partout.",
  "Le message doit pouvoir recevoir une réponse en une phrase : donne une prise, ne demande pas un effort.",
  "N'invente aucun fait sur moi ni sur lui.",
  "Jamais de contenu sexuellement explicite, jamais d'insistance, jamais de pression.",
].map((r) => `- ${r}`).join("\n");

export function baseSystem(customStyle?: string): string {
  return [
    "Tu es l'assistant d'écriture d'un utilisateur adulte sur une application de rencontre gay.",
    "Tu écris À SA PLACE, à la première personne, dans son style : messages courts, oraux, sans ponctuation solennelle.",
    "Ton objectif n'est pas d'impressionner, c'est d'obtenir une vraie réponse.",
    "",
    "Règles de rédaction non négociables :",
    WRITING_RULES,
    ...(customStyle?.trim()
      ? [
          "",
          "Style personnel de l'utilisateur à respecter en priorité (tant que cela ne viole pas les règles ci-dessus) :",
          `« ${customStyle.trim()} »`,
        ]
      : []),
    "",
    "Tu réponds EXCLUSIVEMENT en JSON valide conforme au schéma demandé, sans texte autour.",
  ].join("\n");
}

export function describeProfile(p: AiProfileContext): string {
  const parts = [
    `Pseudo : ${p.displayName ?? "(non renseigné)"}`,
    p.age ? `Âge : ${p.age} ans` : null,
    p.aboutMe ? `Bio : « ${p.aboutMe} »` : "Bio : (vide)",
    p.tribes.length ? `Tribus : ${p.tribes.join(", ")}` : null,
    p.lookingFor.length ? `Cherche : ${p.lookingFor.join(", ")}` : null,
    p.tracks.length ? `Morceaux mis en avant : ${p.tracks.join(" | ")}` : null,
  ];
  return parts.filter(Boolean).join("\n");
}

export function describeMessages(messages: AiChatMessage[]): string {
  if (messages.length === 0) return "(aucun message échangé)";
  return messages
    .slice(-30)
    .map((m) => `${m.from === "me" ? "MOI" : "LUI"} : ${m.text}`)
    .join("\n");
}

export const PROMPTS = {
  replySuggestions(messages: AiChatMessage[], profile: AiProfileContext, tone: AiTone) {
    return [
      "## Son profil",
      describeProfile(profile),
      "",
      "## Conversation (du plus ancien au plus récent)",
      describeMessages(messages),
      "",
      "## Ta tâche",
      "Propose 3 messages que je pourrais envoyer MAINTENANT, en réponse au dernier message.",
      "",
      "Avant d'écrire, identifie en silence : où en est la conversation (premiers échanges / on se découvre / on parle de se voir), quel est le dernier signal qu'il m'a envoyé, et ce qui bloquerait si je répondais à côté.",
      "",
      "Les 3 propositions doivent être NETTEMENT différentes entre elles :",
      "1. Une qui rebondit sur le dernier message avec une question précise (pas « et toi ? »).",
      "2. Une qui apporte quelque chose de moi (une réaction, une anecdote en une ligne) pour donner de la matière.",
      "3. Une qui fait avancer la conversation d'un cran (proposer un sujet plus perso, ou proposer de se voir SI et seulement SI le ton de la conversation le permet déjà).",
      "",
      `Longueur : 8 à 25 mots chacune. Ton demandé — ${TONE_HINT[tone]}`,
      "",
      "Si le dernier message exprime un refus, un désintérêt ou une gêne, ne relance pas : propose des messages qui respectent ce signal, ou qui clôturent poliment.",
    ].join("\n");
  },

  icebreaker(profile: AiProfileContext, tone: AiTone) {
    return [
      "## Son profil",
      describeProfile(profile),
      "",
      "## Ta tâche",
      "Écris 3 tout premiers messages différents à envoyer à cette personne. Nous n'avons jamais échangé.",
      "",
      "Chaque message DOIT s'appuyer sur un élément précis de son profil et le rendre visible : cite ou reformule le détail utilisé, pour qu'il comprenne immédiatement que je l'ai lu.",
      "Si sa bio est vide et qu'il n'y a aucun détail exploitable, dis-le autrement : pose une question ouverte mais originale, jamais « salut ça va ».",
      "",
      "Varie les angles : une question sur un détail, une réaction/opinion assumée sur ce qu'il a mis, un message plus joueur.",
      `Longueur : 8 à 25 mots. Ton demandé — ${TONE_HINT[tone]}`,
      "",
      "Interdits absolus : compliment sur le physique, « t'as un beau sourire », « tu me plais », toute question sur ce qu'il cherche sexuellement.",
    ].join("\n");
  },

  scamCheck(messages: AiChatMessage[]) {
    return [
      "## Messages à analyser",
      describeMessages(messages),
      "",
      "## Ta tâche",
      "Évalue si l'interlocuteur (LUI) présente des signaux d'arnaque connus sur les apps de rencontre.",
      "",
      "Signaux à rechercher :",
      "- Demande d'argent, de cartes cadeaux, de recharge téléphonique, d'aide financière, même indirecte ou « temporaire ».",
      "- Proposition d'investissement, crypto, trading, « je te montre comment gagner ».",
      "- Lien externe vers un site de vérification, de « certification d'âge », de webcam payante, ou raccourci d'URL.",
      "- Pression pour passer très vite sur WhatsApp/Telegram/e-mail dès les premiers messages.",
      "- Demande de photos intimes suivie d'une menace, ou allusion à une diffusion.",
      "- Urgence artificielle, histoire dramatique (accident, douane, visa bloqué), déclaration amoureuse immédiate.",
      "- Incohérences : ne répond jamais aux questions précises, réponses génériques ou copiées-collées.",
      "- Prétend être bloqué à l'étranger, militaire, sur une plateforme pétrolière.",
      "",
      "Calibrage — évite les faux positifs :",
      "- Demander le numéro ou proposer Snap après plusieurs échanges normaux n'est PAS une arnaque.",
      "- Un message direct, cru ou sexuel n'est PAS une arnaque (c'est hors sujet ici).",
      "- Un lien vers un profil Instagram personnel n'est pas suspect en soi.",
      "- Si tu hésites entre none et low, choisis none.",
      "",
      "risk : \"high\" = au moins un signal clair et explicite. \"low\" = un seul signal ambigu. \"none\" = rien.",
      "reasons : une phrase courte par signal, en citant entre guillemets le bout de message concerné. Vide si risk = none.",
    ].join("\n");
  },

  conversationSummary(messages: AiChatMessage[]) {
    return [
      "## Conversation",
      describeMessages(messages),
      "",
      "## Ta tâche",
      "summary : 2 phrases maximum. Où en est cette conversation et ce qui est en attente (à qui la balle).",
      "",
      "facts : les informations concrètes qu'il a données sur lui ou que nous avons convenues — prénom, âge, ville ou quartier, métier, langue, ce qu'il cherche, disponibilités, lieu/date/heure d'un rendez-vous, limites exprimées.",
      "Une info par entrée, formulée court : « Prénom : Karim », « RDV proposé : samedi 20h, chez lui », « Ne boit pas d'alcool ».",
      "",
      "Règle absolue : n'écris que ce qui a été réellement dit. Aucune déduction, aucune supposition, aucun remplissage. Si rien n'a été dit de concret, facts est un tableau vide.",
    ].join("\n");
  },

  bioAssistant(bio: string, tone: AiTone) {
    return [
      "## Ma bio actuelle",
      bio.trim() ? `« ${bio.trim()} »` : "(vide)",
      "",
      "## Ta tâche",
      "variants : 3 réécritures de ma bio, 200 caractères maximum chacune.",
      "",
      "Ce qui fait une bonne bio ici :",
      "- Du concret et du spécifique : ce que je fais vraiment, un détail qui ne pourrait être écrit par personne d'autre.",
      "- Elle donne une prise : quelqu'un doit pouvoir m'écrire en rebondissant dessus.",
      "- Elle dit ce que je cherche sans en faire un cahier des charges.",
      "- Un ton assumé vaut mieux qu'un ton consensuel.",
      "",
      "Interdits : listes d'adjectifs (« sympa, drôle, sportif »), clichés (« j'aime voyager et rigoler », « pas sérieux s'abstenir », « demande et je te dirai »), négativité ou liste de ce que je ne veux pas, emojis en rafale, hashtags.",
      "",
      "Si ma bio est vide, ne pars pas de rien : propose 3 structures de bio différentes et clairement complétables (ce que je fais / ce qui m'intéresse / ce que je cherche), sans inventer de faits précis sur moi.",
      "Si ma bio existe, garde ma matière et ma voix — tu reformules, tu ne remplaces pas ma personnalité.",
      "",
      `Ton demandé — ${TONE_HINT[tone]}`,
      "",
      "warnings : signale toute information qui m'expose dans la bio d'origine (adresse ou rue, nom de l'employeur, école, numéro de téléphone, pseudo de réseau social, plaque, lieu de travail précis, nom complet). Une phrase par risque, avec ce qu'il faut retirer. Tableau vide s'il n'y a rien.",
    ].join("\n");
  },

  naturalSearch(query: string) {
    return [
      `## Requête de l'utilisateur`,
      `« ${query} »`,
      "",
      "## Ta tâche",
      "Convertis cette requête en filtres de recherche.",
      "",
      "Filtres disponibles (aucun autre n'existe) :",
      "- ageMin / ageMax : nombres. « la vingtaine » → 20-29. « plus de 30 » → ageMin 30, ageMax null. « vers 25 ans » → 22-28.",
      "- online : true seulement si l'utilisateur demande explicitement les personnes en ligne / connectées / dispo maintenant.",
      "- query : mots-clés à chercher dans le pseudo. N'y mets QUE ce qui ressemble à un nom ou un pseudo. Ne recopie jamais un critère déjà exprimé par les autres filtres, et n'y mets pas des critères non supportés (taille, tribu, distance, morphologie) — ils seraient cherchés dans le pseudo et ne donneraient rien.",
      "",
      "Tout filtre non exprimé vaut null. N'invente aucune valeur.",
      "",
      "explanation : une phrase en français décrivant les filtres retenus, et mentionnant explicitement les critères de la requête qui n'ont PAS pu être appliqués (ex : « la taille n'est pas filtrable ici »).",
    ].join("\n");
  },

  profileSummary(profile: AiProfileContext, me: AiProfileContext) {
    return [
      "## Mon profil",
      describeProfile(me),
      "",
      "## Son profil",
      describeProfile(profile),
      "",
      "## Ta tâche",
      "summary : 2 phrases maximum, à la 3e personne, pour m'aider à décider si je lui écris. Qui il semble être et ce qu'il cherche, uniquement d'après ce qu'il a écrit. Si son profil est trop vide pour conclure, dis-le franchement en une phrase.",
      "",
      "commonPoints : uniquement les points communs réels et vérifiables entre nos deux profils (même goût musical, même tranche d'âge affichée, même recherche, même centre d'intérêt cité). Tableau vide s'il n'y en a aucun — ne force jamais un point commun vague comme « vous cherchez tous les deux à rencontrer du monde ».",
    ].join("\n");
  },
};
