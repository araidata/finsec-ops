import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/server/authorization";

export default async function RetiredPurchasesPage() {
  await requirePermission("contract.read");
  redirect("/contracts");
}
