export type FieldErrors = Record<string, string[]>;

export type ActionResult = {
  ok: boolean;
  message: string;
  fields?: FieldErrors;
};

export const emptyActionResult: ActionResult = {
  ok: false,
  message: "",
};

export class FieldValidationError extends Error {
  fields: FieldErrors;

  constructor(message: string, fields: FieldErrors) {
    super(message);
    this.fields = fields;
  }
}

export function validationFailure(error: unknown): ActionResult {
  if (error instanceof FieldValidationError) {
    return {
      ok: false,
      message: error.message,
      fields: error.fields,
    };
  }

  if (error instanceof Error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: false,
    message: "The change could not be saved.",
  };
}
