import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DocumentAuditTrail } from "@/components/documents/document-audit-trail";

describe("DocumentAuditTrail", () => {
  it("renders the bounded audit DTO without the Documents workspace", () => {
    render(
      <DocumentAuditTrail
        logs={[
          {
            id: "activity-1",
            action: "CREATE",
            entityType: "Document",
            entityId: "document-1",
            occurredAt: "2026-07-29T12:00:00.000Z",
            actor: { name: "Alex Analyst" },
          },
        ]}
      />
    );

    expect(screen.getByText("Alex Analyst")).toBeInTheDocument();
    expect(screen.getByText("created Document")).toBeInTheDocument();
    expect(screen.getByText(/Document · document-1/)).toBeInTheDocument();
  });
});
