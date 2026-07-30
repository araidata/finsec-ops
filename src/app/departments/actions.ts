"use server";

import { revalidatePath } from "next/cache";

import { publicActionFailure, type ActionResult } from "@/lib/server/action-result";
import {
  reassignDepartment,
  type ReassignDepartmentInput,
} from "@/lib/server/department-reassignment-service";

export async function reassignDepartmentAction(
  input: ReassignDepartmentInput
): Promise<ActionResult> {
  try {
    const result = await reassignDepartment(input);
    for (const path of ["/budgets", "/contracts", "/renewals", "/documents", "/"])
      revalidatePath(path);
    return {
      ok: true,
      message: `${result.moved} record${result.moved === 1 ? "" : "s"} moved to ${result.departmentName}.`,
      data: result as unknown as Record<string, unknown>,
    };
  } catch (error) {
    return publicActionFailure(error);
  }
}
