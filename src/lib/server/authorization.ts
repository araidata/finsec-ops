export type Permission =
  | "budget.maintenance.create"
  | "budget.write"
  | "catalog.write"
  | "contracts.write"
  | "departments.reassign"
  | "deployment.write"
  | "documents.write"
  | "renewals.write"
  | "settings.write";

export type PermissionRequest = {
  permission: Permission;
  departmentId?: string | null;
};

export type AuthorizationContext = {
  actorId: string | null;
};

export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Central mutation authorization boundary.
 *
 * Development and tests remain usable while the Entra session provider is
 * configured. Production fails closed until a verified identity is supplied by
 * that provider; no browser-provided Department value can grant access.
 */
export async function requirePermission(
  request: PermissionRequest
): Promise<AuthorizationContext> {
  void request;

  if (process.env.NODE_ENV !== "production") {
    return { actorId: null };
  }

  throw new AuthorizationError(
    "Authentication is required before this action can be used."
  );
}
