export type EntraIdentity = {
  subject: string;
  tenantId: string;
};

export function entraIdentityFromProfile(
  profile: Record<string, unknown> | undefined
): EntraIdentity | null {
  const subject = profile?.sub;
  const tenantId = profile?.tid;
  if (
    typeof subject !== "string" ||
    !subject.trim() ||
    typeof tenantId !== "string" ||
    !tenantId.trim()
  ) {
    return null;
  }
  return { subject: subject.trim(), tenantId: tenantId.trim() };
}
