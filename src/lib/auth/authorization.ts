export const permissions = [
  "dashboard.read",
  "budget.read",
  "budget.edit",
  "budget.approve",
  "budget.export",
  "contract.read",
  "contract.edit",
  "contract.terminate",
  "renewal.read",
  "renewal.edit",
  "renewal.approve",
  "catalog.read",
  "catalog.edit",
  "deployment.read",
  "deployment.edit",
  "document.read",
  "document.edit",
  "settings.read",
  "settings.edit",
  "department.reassign",
] as const;

export type Permission = (typeof permissions)[number];

export const applicationRoles = [
  "PLATFORM_ADMIN",
  "FINANCE_ADMIN",
  "DEPARTMENT_EDITOR",
  "DEPARTMENT_VIEWER",
  "AUDITOR",
] as const;

export type ApplicationRole = (typeof applicationRoles)[number];

const readPermissions: Permission[] = [
  "dashboard.read",
  "budget.read",
  "contract.read",
  "renewal.read",
  "catalog.read",
  "deployment.read",
  "document.read",
];

export const rolePermissionMatrix: Record<
  ApplicationRole,
  {
    crossDepartment: boolean;
    permissions: readonly Permission[];
  }
> = {
  PLATFORM_ADMIN: {
    crossDepartment: true,
    permissions,
  },
  FINANCE_ADMIN: {
    crossDepartment: true,
    permissions: [
      ...readPermissions,
      "budget.edit",
      "budget.approve",
      "budget.export",
      "contract.edit",
      "renewal.edit",
      "renewal.approve",
      "deployment.edit",
      "document.edit",
    ],
  },
  DEPARTMENT_EDITOR: {
    crossDepartment: false,
    permissions: [
      ...readPermissions,
      "budget.edit",
      "contract.edit",
      "renewal.edit",
      "catalog.edit",
      "deployment.edit",
      "document.edit",
    ],
  },
  DEPARTMENT_VIEWER: {
    crossDepartment: false,
    permissions: readPermissions,
  },
  AUDITOR: {
    crossDepartment: true,
    permissions: [...readPermissions, "budget.export"],
  },
};

export function applicationRole(value: string | null): ApplicationRole | null {
  const normalized = value?.trim().toUpperCase();
  return applicationRoles.find((role) => role === normalized) ?? null;
}

export function roleHasPermission(
  role: ApplicationRole,
  permission: Permission
): boolean {
  return rolePermissionMatrix[role].permissions.includes(permission);
}

export function roleHasCrossDepartmentAccess(role: ApplicationRole): boolean {
  return rolePermissionMatrix[role].crossDepartment;
}
