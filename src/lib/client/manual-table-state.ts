import type { SortingState, Updater } from "@tanstack/react-table";

export type DocumentTableSort = "uploadedDesc" | "uploadedAsc" | "titleAsc";

export function resolveTableUpdater<T>(updater: Updater<T>, current: T): T {
  return typeof updater === "function"
    ? (updater as (previous: T) => T)(current)
    : updater;
}

export function documentSortingState(sort: DocumentTableSort): SortingState {
  if (sort === "titleAsc") return [{ id: "title", desc: false }];
  return [{ id: "uploadedAt", desc: sort === "uploadedDesc" }];
}

export function documentSortFromState(
  sorting: SortingState
): DocumentTableSort {
  const active = sorting[0];
  if (active?.id === "title") return "titleAsc";
  return active?.desc === false ? "uploadedAsc" : "uploadedDesc";
}
