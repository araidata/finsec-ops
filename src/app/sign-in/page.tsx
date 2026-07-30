import { ShieldCheck } from "lucide-react";

import { signIn } from "@/auth";
import { isEntraAuthConfigured, safeCallbackPath } from "@/lib/auth/config";

async function signInWithMicrosoft(formData: FormData) {
  "use server";

  if (!isEntraAuthConfigured()) return;
  await signIn("microsoft-entra-id", {
    redirectTo: safeCallbackPath(formData.get("callbackUrl")),
  });
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
    error?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackPath(
    typeof params?.callbackUrl === "string"
      ? params.callbackUrl
      : params?.callbackUrl?.[0]
  );
  const error =
    typeof params?.error === "string" ? params.error : params?.error?.[0];
  const configured = isEntraAuthConfigured();

  return (
    <main className="fin-grid flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <section className="w-full max-w-md rounded-xl border border-border/80 bg-card/95 p-7 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
            <ShieldCheck aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-50">
              Sign in to finsec-ops
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Technology Financial Operations
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm leading-6 text-muted-foreground">
          Use your approved organizational Microsoft Entra ID account.
        </p>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">
            Access was denied. Contact an administrator if you require access.
          </p>
        ) : null}

        {!configured ? (
          <p className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-200">
            Entra authentication is not configured for this environment.
          </p>
        ) : null}

        <form action={signInWithMicrosoft} className="mt-6">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <button
            type="submit"
            disabled={!configured}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue with Microsoft
          </button>
        </form>
      </section>
    </main>
  );
}
