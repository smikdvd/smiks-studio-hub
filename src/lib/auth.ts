import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Resend } from "resend";
import { prisma } from "./prisma";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  return new Resend(process.env.RESEND_API_KEY);
}

function emailHtml(name: string, heading: string, body: string, btnText: string, url: string) {
  return `<div style="font-family:'Helvetica Neue',sans-serif;background:#0d1b2e;padding:40px 20px;">
    <div style="max-width:480px;margin:0 auto;background:#163045;border-radius:16px;padding:40px;border:1px solid rgba(245,234,214,0.15);">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:2rem;margin-bottom:8px;">🎙️</div>
        <div style="font-size:1.1rem;font-weight:900;color:#f5ead6;letter-spacing:0.04em;text-transform:uppercase;">Smiks' Studio Hub</div>
      </div>
      <h2 style="color:#f5ead6;font-size:1.1rem;font-weight:700;margin:0 0 12px;">${heading}</h2>
      <p style="color:#c8b896;font-size:0.85rem;line-height:1.6;margin:0 0 28px;">Hi ${name},<br><br>${body}</p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${url}" style="background:linear-gradient(135deg,#d4a843,#b8902a);color:#0d1b2e;padding:13px 32px;text-decoration:none;border-radius:8px;font-weight:800;font-size:0.85rem;letter-spacing:0.06em;text-transform:uppercase;display:inline-block;">${btnText}</a>
      </div>
      <p style="color:rgba(245,234,214,0.4);font-size:0.7rem;text-align:center;margin:0;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>`;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await getResend().emails.send({
        from: "Smiks Studio Hub <onboarding@resend.dev>",
        to: user.email,
        subject: "Verify your email — Smiks' Studio Hub",
        html: emailHtml(user.name || user.email, "Verify Your Email Address", "Click the button below to verify your email address and secure your account.", "Verify Email", url),
      });
    },
    sendChangeEmailVerification: async ({ user, newEmail, url }) => {
      await getResend().emails.send({
        from: "Smiks Studio Hub <onboarding@resend.dev>",
        to: newEmail,
        subject: "Confirm your new email — Smiks' Studio Hub",
        html: emailHtml(user.name || user.email, "Confirm New Email Address", `You requested to change your email to <strong>${newEmail}</strong>. Click the button below to confirm.`, "Confirm New Email", url),
      });
    },
    autoSignInAfterVerification: true,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "https://crm-eight-virid.vercel.app",
  ],
});
