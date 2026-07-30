export type MaintenanceRenewalRegisterQuery = {
  departmentId?: string;
  fiscalYearId?: string;
  search?: string;
  status?: string;
  ownerId?: string;
  vendorId?: string;
  resellerId?: string;
  coOpAgreement?: string;
  windowDays?: number | null;
  sort?: "renewalDateAsc" | "renewalDateDesc" | "updatedAtDesc";
  page?: number;
  pageSize?: number;
};

function normalizedQuery(input: MaintenanceRenewalRegisterQuery) {
  return {
    departmentId: input.departmentId ?? "",
    fiscalYearId: input.fiscalYearId ?? "",
    search: input.search?.trim() ?? "",
    status: input.status ?? "",
    ownerId: input.ownerId ?? "",
    vendorId: input.vendorId ?? "",
    resellerId: input.resellerId ?? "",
    coOpAgreement: input.coOpAgreement ?? "",
    windowDays: input.windowDays ?? null,
    sort: input.sort ?? "renewalDateAsc",
    page: input.page ?? 1,
    pageSize: input.pageSize ?? 50,
  };
}

export const maintenanceRenewalQueryKeys = {
  all: ["maintenance-renewals"] as const,
  registers: () => ["maintenance-renewals", "register"] as const,
  register: (input: MaintenanceRenewalRegisterQuery) =>
    ["maintenance-renewals", "register", normalizedQuery(input)] as const,
};

export function maintenanceRenewalRegisterSearchParams(
  input: MaintenanceRenewalRegisterQuery
) {
  const query = normalizedQuery(input);
  const params = new URLSearchParams();
  if (query.departmentId) params.set("department", query.departmentId);
  if (query.fiscalYearId) params.set("fy", query.fiscalYearId);
  if (query.search) params.set("q", query.search);
  if (query.status) params.set("status", query.status);
  if (query.ownerId) params.set("owner", query.ownerId);
  if (query.vendorId) params.set("vendor", query.vendorId);
  if (query.resellerId) params.set("reseller", query.resellerId);
  if (query.coOpAgreement) params.set("coop", query.coOpAgreement);
  if (query.windowDays) params.set("window", String(query.windowDays));
  params.set("sort", query.sort);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return params;
}
