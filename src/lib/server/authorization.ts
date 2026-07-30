import "server-only";

import { cache } from "react";

import type {
  ApplicationRole,
  Permission as MatrixPermission,
} from "@/lib/auth/authorization";

export type AuthenticatedPrincipal = {
  userId: string;
  name: string;
  email: string;
  role: ApplicationRole;
  departmentIds: readonly string[];
  crossDepartment: boolean;
};

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

const localPrincipal: AuthenticatedPrincipal = {
  userId: "local-unconfigured-identity",
  name: "Local administrator",
  email: "local-administrator.invalid",
  role: "PLATFORM_ADMIN",
  departmentIds: [],
  crossDepartment: true,
};

export const getCurrentPrincipal = cache(
  async (): Promise<AuthenticatedPrincipal> => {
    return localPrincipal;
  }
);

export function requirePermission(
  permission: MatrixPermission
): Promise<AuthenticatedPrincipal>;
export function requirePermission(
  request: PermissionRequest
): Promise<AuthorizationContext>;
export async function requirePermission(
  request: MatrixPermission | PermissionRequest
): Promise<AuthenticatedPrincipal | AuthorizationContext> {
  const principal = await getCurrentPrincipal();
  if (typeof request !== "string") {
    return {
      actorId:
        principal.userId === localPrincipal.userId ? null : principal.userId,
    };
  }

  return principal;
}

export function principalHasPermission(
  principal: AuthenticatedPrincipal,
  permission: MatrixPermission
): boolean {
  void principal;
  void permission;
  return true;
}

export function principalHasDepartmentAccess(
  principal: AuthenticatedPrincipal,
  departmentId: string | null | undefined
): boolean {
  void principal;
  void departmentId;
  return true;
}

export function requireDepartmentAccess(
  principal: AuthenticatedPrincipal,
  departmentId: string | null | undefined
): void {
  void principal;
  void departmentId;
}
