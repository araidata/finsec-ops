import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HeaderSearch } from "@/components/app/header-search";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams("department=security&fy=fy-2026"),
}));

describe("HeaderSearch", () => {
  beforeEach(() => {
    navigation.push.mockReset();
  });

  it("uses an App Router transition when the search form is submitted", () => {
    render(<HeaderSearch />);

    fireEvent.change(screen.getByRole("textbox", { name: "Search" }), {
      target: { value: "contracts" },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(navigation.push).toHaveBeenCalledWith(
      "/contracts?department=security&fy=fy-2026"
    );
  });

  it("preserves global context in result links", () => {
    render(<HeaderSearch />);

    fireEvent.change(screen.getByRole("textbox", { name: "Search" }), {
      target: { value: "vendor" },
    });

    expect(
      screen.getByRole("link", { name: /Product Catalog/ })
    ).toHaveAttribute("href", "/products?department=security&fy=fy-2026");
  });
});
