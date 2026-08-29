import { ENV } from "./_core/env";

export type EmailMessage = { to: string; subject: string; text: string; html?: string };

export async function sendEmail(message: EmailMessage) {
  if (ENV.email.provider === "console") {
    console.info(JSON.stringify({ event: "email.queued_console", to: message.to, subject: message.subject }));
    return { provider: "console", delivered: false } as const;
  }
  if (ENV.email.provider !== "resend") throw new Error(`Unsupported EMAIL_PROVIDER: ${ENV.email.provider}`);
  if (!ENV.email.apiKey || !ENV.email.from) throw new Error("EMAIL_API_KEY and EMAIL_FROM are required for Resend");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${ENV.email.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: ENV.email.from, to: [message.to], subject: message.subject, text: message.text, ...(message.html ? { html: message.html } : {}) }),
  });
  if (!response.ok) throw new Error(`Email delivery failed (${response.status}): ${await response.text()}`);
  const result = await response.json() as { id?: string };
  return { provider: "resend", delivered: true, id: result.id } as const;
}
