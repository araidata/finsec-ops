import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  applicationRole,
  roleHasCrossDepartmentAccess,
  roleHasPermission,
  type ApplicationRole,
  type Permission as MatrixPermission,
} from "@/lib/auth/authorization";
import { isNonProductionAuthBypassEnabled } from "@/lib/auth/config";
import { getPrisma } from "@/lib/server/prisma";

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

const legacyPermissionMap: Record<Permission, MatrixPermission> = {
  "budget.maintenance.create": "budget.edit",
  "budget.write": "budget.edit",
  "catalog.write": "catalog.edit",
  "contracts.write": "contract.edit",
  "departments.reassign": "department.reassign",
  "deployment.write": "deployment.edit",
  "documents.write": "document.edit",
  "renewals.write": "renewal.edit",
  "settings.write": "settings.edit",
};

const bypassPrincipal: AuthenticatedPrincipal = {
  userId: "non-production-auth-bypass",
  name: "Local automation",
  email: "local-automation.invalid",
  role: "PLATFORM_ADMIN",
  departmentIds: [],
  crossDepartment: true,
};

export const getCurrentPrincipal = cache(
  async (): Promise<AuthenticatedPrincipal | null> => {
    if (isNonProductionAuthBypassEnabled()) return bypassPrincipal;

    const session = await auth();
    const subject = session?.user?.entraSubject;
    const tenantId = session?.user?.entraTenantId;
    if (!subject || !tenantId) return null;

    try {
      const user = await getPrisma().user.findUnique({
        where: {
          entraTenantId_entraSubject: {
            entraTenantId: tenantId,
            entraSubject: subject,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          departmentAccess: {
            select: { departmentId: true },
          },
        },
      });
      const role = applicationRole(user?.role ?? null);
      if (!user?.active || !role) return null;

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        role,
        departmentIds: user.departmentAccess.map(
          (access) => access.departmentId
        ),
        crossDepartment: roleHasCrossDepartmentAccess(role),
      };
    } catch {
      return null;
    }
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
    if (!principal) {
      throw new AuthorizationError("Authentication is required.");
    }
    const permission = legacyPermissionMap[request.permission];
    if (
      !roleHasPermission(principal.role, permission) ||
      !principalHasDepartmentAccess(principal, request.departmentId)
    ) {
      throw new AuthorizationError();
    }
    return {
      actorId:
        principal.userId === bypassPrincipal.userId ? null : principal.userId,
    };
  }

  if (!principal) redirect("/sign-in");
  if (!roleHasPermission(principal.role, request)) {
    redirect("/sign-in?error=AccessDenied");
  }
  return principal;
}

export function principalHasPermission(
  principal: AuthenticatedPrincipal,
  permission: MatrixPermission
): boolean {
  return roleHasPermission(principal.role, permission);
}

export function principalHasDepartmentAccess(
  principal: AuthenticatedPrincipal,
  departmentId: string | null | undefined
): boolean {
  if (principal.crossDepartment) return true;
  if (!departmentId || departmentId === "all") return false;
  return principal.departmentIds.includes(departmentId);
}

export function requireDepartmentAccess(
  principal: AuthenticatedPrincipal,
  departmentId: string | null | undefined
): void {
  if (!principalHasDepartmentAccess(principal, departmentId)) {
    redirect("/sign-in?error=DepartmentAccessDenied");
  }
}
