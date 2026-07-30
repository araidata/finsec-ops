import { describe, expect, it } from "vitest";

import {
  FieldValidationError,
  publicActionFailure,
} from "@/lib/server/action-result";

describe("publicActionFailure", () => {
  it("preserves reviewed validation and authorization messages", () => {
    expect(
      publicActionFailure(
        new FieldValidationError("Review the fields.", {
          name: ["Required."],
        })
      )
    ).toEqual({
      ok: false,
      message: "Review the fields.",
      fields: { name: ["Required."] },
    });
    const authorizationError = new Error("Permission denied.");
    authorizationError.name = "AuthorizationError";
    expect(publicActionFailure(authorizationError)).toEqual({
      ok: false,
      message: "Permission denied.",
    });
  });

  it("does not expose unexpected infrastructure errors", () => {
    expect(
      publicActionFailure(
        new Error("database connection failed for private.internal")
      )
    ).toEqual({
      ok: false,
      message: "The change could not be saved.",
    });
  });
});
