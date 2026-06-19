import { Resend } from "resend";

// Password-reset emails go out through Resend. Key + sender live in env
// (RESEND_API_KEY / RESEND_FROM); see .env.example.

/** True when Resend is configured. Checked before any user lookup so a
 * missing-config 503 can't leak account existence (enumeration). */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  return resend.emails.send({
    from: process.env.RESEND_FROM as string,
    to,
    subject: "Réinitialisation de votre mot de passe",
    html: `
      <p>Bonjour,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
      <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
      <p>Ce lien est valide pendant 1 heure.</p>
      <p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>
    `,
  });
}
