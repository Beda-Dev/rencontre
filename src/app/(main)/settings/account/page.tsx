"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { BackIcon } from "@/components/icons";
import {
  useChangeEmailMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useForgotPasswordMutation,
  useMeQuery,
} from "@/lib/queries";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { data: me } = useMeQuery();
  const changeEmail = useChangeEmailMutation();
  const changePassword = useChangePasswordMutation();
  const forgotPassword = useForgotPasswordMutation();
  const deleteAccount = useDeleteAccountMutation();

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailDone, setEmailDone] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordDone, setPasswordDone] = useState(false);

  const [forgotDone, setForgotDone] = useState(false);

  async function handleChangeEmail(e: FormEvent) {
    e.preventDefault();
    await changeEmail.mutateAsync({ newEmail, password: emailPassword });
    setEmailDone(true);
    setNewEmail("");
    setEmailPassword("");
    setTimeout(() => setEmailDone(false), 2500);
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    await changePassword.mutateAsync({ oldPassword, newPassword });
    setPasswordDone(true);
    setOldPassword("");
    setNewPassword("");
    setTimeout(() => setPasswordDone(false), 2500);
  }

  async function handleForgotPassword() {
    if (!me) return;
    await forgotPassword.mutateAsync(me.email);
    setForgotDone(true);
    setTimeout(() => setForgotDone(false), 2500);
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Supprimer définitivement ce compte ? Cette action est irréversible."
      )
    )
      return;
    await deleteAccount.mutateAsync();
    router.push("/login");
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <TopBar
        title="Compte"
        right={
          <button onClick={() => router.back()} className="p-1">
            <BackIcon className="h-5 w-5" />
          </button>
        }
      />

      <div className="space-y-6 px-4 py-6">
        <form onSubmit={handleChangeEmail} className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
            Changer d&apos;email
          </h2>
          <p className="text-xs text-white/40">Actuel : {me?.email}</p>
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Nouvel email"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
          <input
            type="password"
            required
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            placeholder="Mot de passe actuel"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={changeEmail.isPending}
            className="w-full rounded-lg bg-blue-400 py-2.5 text-sm font-semibold text-black hover:bg-blue-300 disabled:opacity-60"
          >
            {emailDone ? "Email modifié ✓" : changeEmail.isPending ? "…" : "Modifier l'email"}
          </button>
        </form>

        <form onSubmit={handleChangePassword} className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
            Changer de mot de passe
          </h2>
          <input
            type="password"
            required
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Mot de passe actuel"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nouveau mot de passe"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={changePassword.isPending}
            className="w-full rounded-lg bg-blue-400 py-2.5 text-sm font-semibold text-black hover:bg-blue-300 disabled:opacity-60"
          >
            {passwordDone
              ? "Mot de passe modifié ✓"
              : changePassword.isPending
                ? "…"
                : "Modifier le mot de passe"}
          </button>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-center text-xs text-white/40 underline hover:text-white/70"
          >
            {forgotDone ? "Email envoyé ✓" : "Mot de passe oublié ?"}
          </button>
        </form>

        <div className="space-y-2 rounded-lg border border-red-400/30 p-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-red-400">
            Zone dangereuse
          </h2>
          <p className="text-xs text-white/50">
            Supprime définitivement ce compte et toutes ses données côté serveur.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleteAccount.isPending}
            className="w-full rounded-lg border border-red-400/40 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10 disabled:opacity-60"
          >
            Supprimer le compte
          </button>
        </div>
      </div>
    </div>
  );
}
