import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceShell } from "@/components/app/workspace-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/budgets",
}));

describe("WorkspaceShell", () => {
  it("keeps a header toggle available so the menu can collapse and reopen", () => {
    const { container } = render(
      <WorkspaceShell
        title="Budgets"
        description="Desktop workspace"
        actionLabel="Add Budget"
      >
        <div>Workspace body</div>
      </WorkspaceShell>
    );

    const sidebar = container.querySelector(
      '[data-slot="sidebar"][data-state]'
    );
    const toggle = screen.getByLabelText("Toggle navigation");

    expect(sidebar).toHaveAttribute("data-state", "expanded");

    fireEvent.click(toggle);
    expect(sidebar).toHaveAttribute("data-state", "collapsed");

    fireEvent.click(toggle);
    expect(sidebar).toHaveAttribute("data-state", "expanded");
  });

  it("renders optional title actions beside the workspace title", () => {
    render(
      <WorkspaceShell
        title="Budgets"
        description="Desktop workspace"
        titleActions={<button type="button">Title Action</button>}
      >
        <div>Workspace body</div>
      </WorkspaceShell>
    );

    expect(screen.getByRole("heading", { name: "Budgets" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Title Action" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Add Budget" })
    ).not.toBeInTheDocument();
  });

  it("shows functional workspace search results from the header", () => {
    window.history.pushState({}, "", "/budgets?department=security&fy=fy-2026");

    render(
      <WorkspaceShell title="Budgets" description="Desktop workspace">
        <div>Workspace body</div>
      </WorkspaceShell>
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Search" }), {
      target: { value: "vendor" },
    });

    expect(screen.getByRole("link", { name: /Product Catalog/ })).toHaveAttribute(
      "href",
      "/products?department=security&fy=fy-2026"
    );
  });
});
