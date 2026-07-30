"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  validationFailure,
} from "@/lib/server/action-result";
import {
  deleteDocument,
  saveDocument,
  searchDocumentLinkTargets,
} from "@/lib/server/documents-service";

export async function searchDocumentLinkTargetsAction(
  input: Parameters<typeof searchDocumentLinkTargets>[0]
) {
  try {
    return { ok: true as const, data: await searchDocumentLinkTargets(input) };
  } catch {
    return {
      ok: false as const,
      message: "Linked records could not be loaded.",
    };
  }
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

async function action(callback: () => Promise<unknown>): Promise<ActionResult> {
  try {
    const result = await callback();
    revalidatePath("/documents");
    return {
      ok: true,
      message: "Document library updated.",
      data: typeof result === "string" ? { id: result } : undefined,
    };
  } catch (error) {
    return validationFailure(error);
  }
}

export async function saveDocumentAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(() =>
    saveDocument({
      id: text(formData, "id"),
      title: text(formData, "title"),
      type: text(formData, "type") as Parameters<
        typeof saveDocument
      >[0]["type"],
      url: text(formData, "url"),
      description: text(formData, "description"),
      entityType: text(formData, "entityType") as Parameters<
        typeof saveDocument
      >[0]["entityType"],
      entityId: text(formData, "entityId"),
      departmentId: text(formData, "departmentId"),
      fiscalYearId: text(formData, "fiscalYearId"),
    })
  );
}

export async function deleteDocumentAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(() => deleteDocument(text(formData, "id")));
}
