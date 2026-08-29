import { describe, expect, it } from "vitest";
import { decryptJson, encryptJson } from "./crypto";

describe("external source configuration encryption", () => {
  it("round-trips a data source endpoint and confidential headers", () => {
    process.env.DATA_ENCRYPTION_KEY = "test-key-for-source-config-encryption";
    const encrypted = encryptJson({ endpoint: "https://api.example.test/v1/records", headers: { Authorization: "Bearer secret" } });
    expect(encrypted.ciphertext).not.toContain("Bearer secret");
    expect(decryptJson(encrypted)).toEqual({ endpoint: "https://api.example.test/v1/records", headers: { Authorization: "Bearer secret" } });
  });

  it("rejects a tampered encrypted payload", () => {
    process.env.DATA_ENCRYPTION_KEY = "test-key-for-source-config-encryption";
    const encrypted = encryptJson({ endpoint: "https://api.example.test" });
    const tamperedCiphertext = `${encrypted.ciphertext.startsWith("A") ? "B" : "A"}${encrypted.ciphertext.slice(1)}`;
    expect(() => decryptJson({ ...encrypted, ciphertext: tamperedCiphertext })).toThrow();
  });
});
