import { Resend } from 'resend';

let resend: Resend | null = null;
const getResend = (): Resend => {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY!);
  }
  return resend;
};

// Without RESEND_API_KEY (local dev, no account set up yet) the reset link
// is logged instead of emailed -- lets forgot-password be tested end to end
// without needing a live Resend account, same reasoning as the local-disk
// fallback in config/storage.ts.
export const sendPasswordResetEmail = async (to: string, resetLink: string): Promise<void> => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] Password reset link for ${to}: ${resetLink}`);
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || 'VNDtracker <onboarding@resend.dev>';

  const { error } = await getResend().emails.send({
    from,
    to,
    subject: 'Reset your VNDtracker password',
    html: `
      <p>Someone requested a password reset for your VNDtracker account.</p>
      <p><a href="${resetLink}">Click here to set a new password</a> (link expires in 1 hour).</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
};
