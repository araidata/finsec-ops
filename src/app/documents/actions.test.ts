import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveDocumentAction } from "@/app/documents/actions";
import { emptyActionResult } from "@/lib/server/action-result";

const cacheMock = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const documentServiceMock = vi.hoisted(() => ({
  deleteDocument: vi.fn(),
  saveDocument: vi.fn(),
}));

vi.mock("next/cache", () => cacheMock);
vi.mock("@/lib/server/documents-service", () => documentServiceMock);

describe("Document actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates only Documents after a library mutation", async () => {
    documentServiceMock.saveDocument.mockResolvedValue("document-1");

    const result = await saveDocumentAction(emptyActionResult, new FormData());

    expect(result.ok).toBe(true);
    expect(cacheMock.revalidatePath.mock.calls).toEqual([["/documents"]]);
  });
});
