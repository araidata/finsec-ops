import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RenewalProductActionMessage } from "./maintenance-renewals-workspace";

afterEach(cleanup);

describe("renewal product mutation feedback", () => {
  it("shows the rejected save and field validation details", () => {
    render(
      <RenewalProductActionMessage
        result={{
          ok: false,
          message: "Please correct the highlighted fields.",
          fields: {
            productId: ["Select an active product."],
            currentQuantity: ["Quantity must be zero or greater."],
          },
        }}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Please correct the highlighted fields."
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Select an active product."
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Quantity must be zero or greater."
    );
  });

  it("shows successful saves and removal failures", () => {
    const { rerender } = render(
      <RenewalProductActionMessage
        result={{ ok: true, message: "Renewal product saved." }}
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Renewal product saved."
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(
      <RenewalProductActionMessage
        result={{
          ok: false,
          message: "Products with deployments cannot be removed.",
        }}
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Products with deployments cannot be removed."
    );
  });

  it("keeps the initial empty result silent", () => {
    const { container } = render(
      <RenewalProductActionMessage result={{ ok: false, message: "" }} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
