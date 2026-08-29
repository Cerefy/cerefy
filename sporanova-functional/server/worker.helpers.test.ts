import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { chunkText, extractDocumentText, normalizedRecords, workflowExecutionPlan } from "./worker";

describe("worker document and synchronization helpers", () => {
  it("splits normalized document text into bounded chunks", () => {
    const chunks = chunkText("  alpha\u0000beta\n" + "x".repeat(9), 5);
    expect(chunks).toEqual(["alpha", "beta\n", "xxxxx", "xxxx"]);
    expect(chunks.every(chunk => chunk.length <= 5)).toBe(true);
  });

  it("returns no chunks for empty or whitespace-only documents", () => {
    expect(chunkText(" \u0000 \n", 10)).toEqual([]);
  });

  it("extracts text/plain and CSV without changing line semantics", async () => {
    await expect(extractDocumentText(Buffer.from("name,region\r\nAcme,North\r\n"), "text/csv"))
      .resolves.toBe("name,region\nAcme,North");
  });

  it("extracts DOCX XML text from the canonical document entry", async () => {
    const zip = new JSZip();
    zip.file("word/document.xml", "<w:document><w:p><w:r><w:t>North</w:t></w:r></w:p><w:p><w:r><w:t>Revenue</w:t></w:r></w:p></w:document>");
    const bytes = await zip.generateAsync({ type: "nodebuffer" });
    await expect(extractDocumentText(bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
      .resolves.toContain("North Revenue");
  });

  it("normalizes API arrays and scalar records for idempotent sync", () => {
    const records = normalizedRecords({ data: [{ id: 42, name: "North" }, { externalId: "customer-7", name: "Acme" }] });
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ externalId: "42", payload: { id: 42, name: "North" } });
    expect(records[1]).toMatchObject({ externalId: "customer-7", payload: { externalId: "customer-7", name: "Acme" } });
    expect(records[0].searchableText).toContain("North");
  });

  it("caps normalized records to the worker safety limit", () => {
    const records = normalizedRecords(Array.from({ length: 1005 }, (_, id) => ({ id })));
    expect(records).toHaveLength(1000);
  });
});

describe("workflow execution policy", () => {
  it("separates executable notifications from unsupported nodes deterministically", () => {
    expect(workflowExecutionPlan([
      { id: 1, nodeKey: "notify-owner", configuration: { action: "create_notification", recipientUserId: 7, title: "Alert", content: "Revenue changed" } },
      { id: 2, nodeKey: "webhook", configuration: { action: "call_webhook" } },
      { id: 3, nodeKey: "missing-config", configuration: null },
    ])).toEqual({ executed: [1], unsupported: ["webhook", "missing-config"] });
  });

  it("returns an empty plan when a workflow has no action nodes", () => {
    expect(workflowExecutionPlan([])).toEqual({ executed: [], unsupported: [] });
  });

  it("does not classify malformed notification configuration as executable", () => {
    expect(workflowExecutionPlan([
      { id: 4, nodeKey: "bad-notification", configuration: { action: "create_notification", recipientUserId: "7", title: "Alert", content: "Revenue changed" } },
    ])).toEqual({ executed: [], unsupported: ["bad-notification"] });
  });
});
