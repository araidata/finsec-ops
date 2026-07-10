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

    const sidebar = container.querySelector('[data-slot="sidebar"][data-state]');
    const toggle = screen.getByLabelText("Toggle navigation");

    expect(sidebar).toHaveAttribute("data-state", "expanded");

    fireEvent.click(toggle);
    expect(sidebar).toHaveAttribute("data-state", "collapsed");

    fireEvent.click(toggle);
    expect(sidebar).toHaveAttribute("data-state", "expanded");
  });
});
