import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AppError from "@/app/error";

describe("AppError", () => {
  it("keeps exception details private and lets the user retry", () => {
    const reset = vi.fn();
    render(
      <AppError
        error={new Error("postgresql://secret-host/private-database")}
        reset={reset}
      />
    );

    expect(
      screen.queryByText(/secret-host|private-database/)
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
