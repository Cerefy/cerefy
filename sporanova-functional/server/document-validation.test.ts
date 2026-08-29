import { describe, expect, it } from "vitest";
import { mimeMatchesBytes } from "./routers/data";

describe("document upload validation", () => {
  it("accepts a PDF only when its file signature is present", () => {
    expect(mimeMatchesBytes("application/pdf", Buffer.from("%PDF-1.7\nexample"))).toBe(true);
    expect(mimeMatchesBytes("application/pdf", Buffer.from("not a pdf"))).toBe(false);
  });

  it("accepts Office documents only when they are ZIP containers", () => {
    expect(mimeMatchesBytes("application/vnd.openxmlformats-officedocument.wordprocessingml.document", Buffer.from("PK\u0003\u0004fixture"))).toBe(true);
    expect(mimeMatchesBytes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Buffer.from("not a zip"))).toBe(false);
  });

  it("rejects binary payloads falsely declared as CSV", () => {
    expect(mimeMatchesBytes("text/csv", Buffer.from("name,value\nSOPRANOVA,1"))).toBe(true);
    expect(mimeMatchesBytes("text/csv", Buffer.from([0x6e, 0x61, 0x6d, 0x65, 0x00]))).toBe(false);
  });
});
