import { redirect } from "next/navigation";

import { safeCallbackPath } from "@/lib/auth/config";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackPath(
    typeof params?.callbackUrl === "string"
      ? params.callbackUrl
      : params?.callbackUrl?.[0]
  );

  redirect(callbackUrl);
}
