import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key() {
  const secret = process.env.DATA_ENCRYPTION_KEY?.trim();
  if (!secret) throw new Error("DATA_ENCRYPTION_KEY is required to configure external data sources");
  return createHash("sha256").update(secret).digest();
}

export function encryptJson(value: Record<string, unknown>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return { version: 1, iv: iv.toString("base64url"), tag: cipher.getAuthTag().toString("base64url"), ciphertext: ciphertext.toString("base64url") };
}

export function decryptJson(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") throw new Error("Encrypted source configuration is invalid");
  const payload = value as { iv?: string; tag?: string; ciphertext?: string };
  if (!payload.iv || !payload.tag || !payload.ciphertext) throw new Error("Encrypted source configuration is incomplete");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(payload.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64url"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64url")), decipher.final()]).toString("utf8");
  return JSON.parse(plaintext) as Record<string, unknown>;
}
