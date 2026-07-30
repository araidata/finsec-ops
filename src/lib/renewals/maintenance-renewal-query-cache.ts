import {
  dehydrate,
  QueryClient,
  type DehydratedState,
} from "@tanstack/react-query";

import {
  maintenanceRenewalQueryKeys,
  type MaintenanceRenewalRegisterQuery,
} from "@/lib/renewals/maintenance-renewal-query";

export function createMaintenanceRenewalHydrationState(
  input: MaintenanceRenewalRegisterQuery,
  data: unknown
): DehydratedState {
  const queryClient = new QueryClient();
  queryClient.setQueryData(maintenanceRenewalQueryKeys.register(input), data);
  return dehydrate(queryClient);
}

export function invalidateMaintenanceRenewalRegisters(
  queryClient: Pick<QueryClient, "invalidateQueries">
) {
  return queryClient.invalidateQueries({
    queryKey: maintenanceRenewalQueryKeys.registers(),
  });
}
