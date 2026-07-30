import { NextResponse } from "next/server";

import { toClientDto } from "@/lib/client-dto";
import {
  getCurrentPrincipal,
  principalHasDepartmentAccess,
  principalHasPermission,
} from "@/lib/server/authorization";
import { listMaintenanceRenewals } from "@/lib/server/maintenance-renewal-service";
import { resolveGlobalContext } from "@/lib/server/global-context";

function positiveInteger(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function boundedPageSize(value: string | null) {
  const parsed = positiveInteger(value);
  return parsed === undefined ? undefined : Math.min(parsed, 100);
}

export async function GET(request: Request) {
  const principal = await getCurrentPrincipal();
  if (!principal) {
    return NextResponse.json(
      { message: "Authentication is required." },
      { status: 401 }
    );
  }
  if (!principalHasPermission(principal, "renewal.read")) {
    return NextResponse.json({ message: "Access is denied." }, { status: 403 });
  }

  try {
    const params = new URL(request.url).searchParams;
    const context = await resolveGlobalContext({
      departmentId: params.get("department") ?? undefined,
      fiscalYearId: params.get("fy") ?? undefined,
    });
    if (
      !principalHasDepartmentAccess(principal, context.selection.departmentId)
    ) {
      return NextResponse.json(
        { message: "Department access is denied." },
        { status: 403 }
      );
    }
    const requestedSort = params.get("sort");
    const data = await listMaintenanceRenewals({
      ...context.serviceSelection,
      search: params.get("q") ?? undefined,
      status: params.get("status") ?? undefined,
      ownerId: params.get("owner") ?? undefined,
      vendorId: params.get("vendor") ?? undefined,
      resellerId: params.get("reseller") ?? undefined,
      coOpAgreement: params.get("coop") ?? undefined,
      windowDays: positiveInteger(params.get("window")),
      sort:
        requestedSort === "renewalDateDesc" || requestedSort === "updatedAtDesc"
          ? requestedSort
          : "renewalDateAsc",
      page: positiveInteger(params.get("page")),
      pageSize: boundedPageSize(params.get("pageSize")),
    });
    return NextResponse.json(toClientDto(data));
  } catch {
    return NextResponse.json(
      { message: "Maintenance renewals could not be loaded." },
      { status: 500 }
    );
  }
}
