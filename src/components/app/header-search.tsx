"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { buildContextualHref, getAppSearchMatches } from "@/lib/app-search";

type HeaderSearchProps = {
  placeholder?: string;
};

export function HeaderSearch({
  placeholder = "Search vendors, contracts, products...",
}: HeaderSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const matches = useMemo(
    () => getAppSearchMatches(query).slice(0, 6),
    [query]
  );
  const currentSearch = searchParams.size ? `?${searchParams.toString()}` : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstMatch = matches[0];

    if (!firstMatch) return;

    router.push(buildContextualHref(firstMatch.href, currentSearch));
    setOpen(false);
  }

  return (
    <form
      role="search"
      className="relative ml-auto hidden w-full max-w-sm md:block"
      onSubmit={handleSubmit}
      onBlur={() => window.setTimeout(() => setOpen(false), 100)}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        aria-label="Search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="h-9 border-border/80 bg-secondary/45 pl-8 text-sm"
        autoComplete="off"
      />
      {open && query.trim() ? (
        <div className="absolute right-0 top-[calc(100%+0.45rem)] z-50 w-full overflow-hidden rounded-lg border border-border/80 bg-popover text-popover-foreground shadow-2xl">
          {matches.length ? (
            <div className="py-1">
              {matches.map((match) => (
                <Link
                  key={match.href}
                  href={buildContextualHref(match.href, currentSearch)}
                  prefetch={false}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 outline-none hover:bg-secondary focus-visible:bg-secondary"
                >
                  <span className="block text-sm font-medium text-slate-100">
                    {match.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {match.description}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No matching workspace found.
            </p>
          )}
        </div>
      ) : null}
    </form>
  );
}
