import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BudgetWorkspace,
  getBudgetWorkspaceTitle,
} from "@/components/budgets/budget-workspace";
import { budgetWorkspaceData } from "@/lib/budgets/budget-data";
import { GlobalContextProvider } from "@/components/app/global-context-provider";

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
}));

const budgetActionsMock = vi.hoisted(() => ({
  createBudgetRowAction: vi.fn(),
  deleteBudgetRowAction: vi.fn(),
  duplicateBudgetRowAction: vi.fn(),
  saveBudgetRowAction: vi.fn(),
  sendBudgetToMaintenanceAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/budgets",
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

vi.mock("@/app/budgets/actions", () => budgetActionsMock);

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

function activeWorksheetTable(): HTMLElement {
  return screen.getAllByRole("table")[0];
}

function renderBudgetWorkspace() {
  return render(
    <BudgetWorkspace initialData={budgetWorkspaceData} persistChanges={false} />
  );
}

function renderBudgetWorkspaceWithData(
  initialData: typeof budgetWorkspaceData
) {
  return render(
    <BudgetWorkspace initialData={initialData} persistChanges={false} />
  );
}

function expectNoRemovedWorksheetHeaders(table: HTMLElement): void {
  ["Account", "Owner", "Actual Spend", "Remaining"].forEach((header) => {
    expect(
      within(table).queryByRole("columnheader", { name: header })
    ).not.toBeInTheDocument();
  });
}

describe("BudgetWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prevents duplicate row creation while a request is pending and allows retry after transport failure", async () => {
    let rejectRequest!: (reason: Error) => void;
    budgetActionsMock.createBudgetRowAction.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectRequest = reject;
        })
    );
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(
      <BudgetWorkspace
        initialData={budgetWorkspaceData}
        initialWorksheet="Professional Services"
      />
    );
    const addButton = screen.getByRole("button", { name: "Add Row" });
    fireEvent.click(addButton);
    expect(addButton).toBeDisabled();
    fireEvent.click(addButton);
    expect(budgetActionsMock.createBudgetRowAction).toHaveBeenCalledTimes(1);
    await act(async () => {
      rejectRequest(new Error("Transport failed"));
    });
    expect(alertSpy).toHaveBeenCalledWith(
      "The Budget row could not be created. Retry the request."
    );
    expect(addButton).toBeEnabled();
    alertSpy.mockRestore();
  });

  it.each(["department-1", "all"])(
    "creates Professional Services with an explicitly selected Department from %s context",
    async (departmentId) => {
      budgetActionsMock.createBudgetRowAction.mockResolvedValue({ ok: true });
      const initialData = {
        ...budgetWorkspaceData,
        accounts: budgetWorkspaceData.accounts.map((account) => ({
          ...account,
          departmentId: "department-1",
          departmentName: "IT Admin",
        })),
      };
      render(
        <GlobalContextProvider
          options={{
            departments: [{ id: "department-1", name: "IT Admin" }],
            fiscalYears: [],
            defaultFiscalYearId: null,
          }}
          selection={{ departmentId, fiscalYearId: "all" }}
        >
          <BudgetWorkspace
            initialData={initialData}
            initialWorksheet="Professional Services"
          />
        </GlobalContextProvider>
      );
      fireEvent.click(screen.getByRole("button", { name: "Add Row" }));
      if (departmentId === "all") {
        expect(budgetActionsMock.createBudgetRowAction).not.toHaveBeenCalled();
        expect(
          screen.getByRole("button", { name: "Create Budget Row" })
        ).toBeDisabled();
        fireEvent.change(
          screen.getByLabelText("Department for new Budget row"),
          { target: { value: "department-1" } }
        );
        fireEvent.click(
          screen.getByRole("button", { name: "Create Budget Row" })
        );
      }
      await waitFor(() =>
        expect(budgetActionsMock.createBudgetRowAction).toHaveBeenCalledWith(
          expect.objectContaining({
            worksheet: "Professional Services",
            departmentId: "department-1",
          })
        )
      );
    }
  );

  it("saves Professional Services quantity, rate, and calculated total", async () => {
    budgetActionsMock.saveBudgetRowAction.mockResolvedValue({ ok: true });
    render(
      <BudgetWorkspace
        initialData={budgetWorkspaceData}
        initialWorksheet="Professional Services"
      />
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit Cloud Security Architecture Assessment",
      })
    );
    fireEvent.change(
      screen.getByLabelText(
        "Amount for Cloud security architecture assessment"
      ),
      { target: { value: "12" } }
    );
    fireEvent.change(
      screen.getByLabelText("Rate for Cloud security architecture assessment"),
      { target: { value: "250" } }
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Done editing Cloud Security Architecture Assessment",
      })
    );
    await waitFor(() =>
      expect(budgetActionsMock.saveBudgetRowAction).toHaveBeenCalledWith(
        expect.objectContaining({
          line: expect.objectContaining({
            id: "fy27-pro-services",
            proposedAmountCents: 300000,
          }),
          detail: expect.objectContaining({ amount: 12, rateCents: 25000 }),
        })
      )
    );
  });

  it("multiplies all Travel costs by attendees when editing and saving", async () => {
    budgetActionsMock.saveBudgetRowAction.mockResolvedValue({ ok: true });
    const detail = budgetWorkspaceData.travelDetails.find(
      (candidate) => candidate.annualFinancialId === "fy27-rsa-travel"
    )!;
    const total =
      2 *
      (detail.airfareCents +
        detail.hotelCents +
        detail.perDiemCents +
        detail.luggageCents +
        detail.parkingCents +
        detail.taxiUberCents);
    render(
      <BudgetWorkspace
        initialData={budgetWorkspaceData}
        initialWorksheet="Travel"
      />
    );
    const row = within(activeWorksheetTable())
      .getByText("RSA Conference")
      .closest("tr")!;
    fireEvent.click(within(row).getByRole("button", { name: /^Edit / }));
    fireEvent.change(screen.getByLabelText("Attendees for RSA Conference"), {
      target: { value: "2" },
    });
    expect(
      within(row).getByText(
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(total / 100)
      )
    ).toBeVisible();
    fireEvent.click(
      within(row).getByRole("button", { name: /^Done editing / })
    );
    await waitFor(() =>
      expect(budgetActionsMock.saveBudgetRowAction).toHaveBeenCalledWith(
        expect.objectContaining({
          line: expect.objectContaining({
            id: "fy27-rsa-travel",
            proposedAmountCents: total,
          }),
          detail: expect.objectContaining({ attendees: 2 }),
        })
      )
    );
  });

  it("keeps All Departments creation available when a global account exists", async () => {
    budgetActionsMock.createBudgetRowAction.mockResolvedValue({ ok: true });
    render(
      <BudgetWorkspace
        initialData={budgetWorkspaceData}
        initialWorksheet="Professional Services"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Row" }));
    await waitFor(() =>
      expect(budgetActionsMock.createBudgetRowAction).toHaveBeenCalledWith(
        expect.objectContaining({
          worksheet: "Professional Services",
          departmentId: undefined,
        })
      )
    );
    expect(
      screen.queryByLabelText("Department for new Budget row")
    ).not.toBeInTheDocument();
  });

  it("uses the selected department in the page title", () => {
    expect(getBudgetWorkspaceTitle("FY2027", "IT Admin")).toBe(
      "FY2027 IT Admin Budget"
    );
    expect(getBudgetWorkspaceTitle("FY2027", "All Departments")).toBe(
      "FY2027 Cybersecurity Budget"
    );
  });

  it("shows one page title and a Software worksheet without removed columns", () => {
    renderBudgetWorkspace();

    expect(
      screen.getAllByRole("heading", {
        name: "FY2027 Cybersecurity Budget",
      })
    ).toHaveLength(1);
    expect(
      screen.queryByText(
        "Fiscal-year financial tracking workspace for cybersecurity budget lines, Finance accounts, and category rollups."
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Search budget rows")
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Fiscal Year")).toBeVisible();
    expect(screen.getByRole("button", { name: "Export" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Add Row" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Software" }));

    expect(screen.getByRole("heading", { name: "Software" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Add Row" })).toBeVisible();
    expect(
      screen.queryByRole("heading", {
        name: "Software, SaaS, Support, and Services",
      })
    ).not.toBeInTheDocument();

    const table = activeWorksheetTable();
    expectNoRemovedWorksheetHeaders(table);
    expect(
      within(table).getByRole("columnheader", { name: "Replacement?" })
    ).toBeVisible();
    expect(
      within(table).getByRole("columnheader", { name: "Replacing" })
    ).toBeVisible();
  });

  it("renders the server-supplied rows for a later manual worksheet page", () => {
    const annual = budgetWorkspaceData.annualFinancials.find(
      (candidate) => candidate.id === "fy27-onetrust"
    );
    expect(annual).toBeDefined();

    renderBudgetWorkspaceWithData({
      ...budgetWorkspaceData,
      annualFinancials: annual ? [annual] : [],
      listState: {
        page: 2,
        pageSize: 1,
        totalItems: 3,
        totalPages: 3,
        search: "",
        sort: "order",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Software" }));

    expect(screen.getByText(/2.+2 of 3/)).toBeVisible();
    expect(
      within(activeWorksheetTable()).getByText("OneTrust Platform Enterprise")
    ).toBeVisible();
  });

  it("updates worksheet totals when a software budget amount changes", () => {
    renderBudgetWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Software" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit OneTrust Platform Enterprise",
      })
    );

    const totalBefore = screen.getByTestId("worksheet-total").textContent;
    fireEvent.change(screen.getByTestId("software-budget-fy27-onetrust"), {
      target: { value: "300000" },
    });

    expect(screen.getByTestId("worksheet-total").textContent).not.toBe(
      totalBefore
    );
    expect(screen.getByText("Unsaved local changes")).toBeVisible();
  });

  it("reconciles refreshed server data without a second router refresh", async () => {
    const view = renderBudgetWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Software" }));

    const sourceAnnual = budgetWorkspaceData.annualFinancials.find(
      (annual) => annual.id === "fy27-onetrust"
    )!;
    const sourceItem = budgetWorkspaceData.items.find(
      (item) => item.id === sourceAnnual.budgetItemId
    )!;
    const nextItem = {
      ...sourceItem,
      id: "item-from-server-refresh",
      name: "Server-added budget row",
    };
    const nextAnnual = {
      ...sourceAnnual,
      id: "annual-from-server-refresh",
      budgetItemId: nextItem.id,
      sortOrder: sourceAnnual.sortOrder + 100,
    };
    const nextData = {
      ...budgetWorkspaceData,
      items: [...budgetWorkspaceData.items, nextItem],
      annualFinancials: [...budgetWorkspaceData.annualFinancials, nextAnnual],
      softwareDetails: [
        ...budgetWorkspaceData.softwareDetails,
        {
          annualFinancialId: nextAnnual.id,
          reseller: "Direct",
          notes: "",
        },
      ],
    };

    view.rerender(
      <BudgetWorkspace initialData={nextData} persistChanges={false} />
    );

    expect(
      await screen.findByText("Server-added budget row")
    ).toBeInTheDocument();
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });

  it("exposes software replacement status and can exit edit mode", () => {
    renderBudgetWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Software" }));

    const table = activeWorksheetTable();
    expect(within(table).getByText("Yes")).toBeVisible();
    expect(
      within(table).getByText("Legacy vendor review tracker")
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit OneTrust Platform Enterprise",
      })
    );

    expect(
      screen.getByLabelText(
        "Replacement status for OneTrust Platform Enterprise"
      )
    ).toBeVisible();
    expect(
      screen.getByLabelText("Replacing for OneTrust Platform Enterprise")
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Done editing OneTrust Platform Enterprise",
      })
    );

    expect(
      screen.queryByLabelText(
        "Replacement status for OneTrust Platform Enterprise"
      )
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Edit OneTrust Platform Enterprise",
      })
    ).toBeVisible();
  });

  it("switches fiscal years and shows the selected budget plan", () => {
    renderBudgetWorkspace();

    fireEvent.change(screen.getByLabelText("Fiscal Year"), {
      target: { value: "FY2026" },
    });

    expect(
      screen.getAllByRole("heading", {
        name: "FY2026 Cybersecurity Budget",
      })
    ).toHaveLength(1);
    expect(screen.getByText("Category Summary")).toBeVisible();
  });

  it("shows and edits training quantity", () => {
    renderBudgetWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Training" }));

    const table = activeWorksheetTable();
    expectNoRemovedWorksheetHeaders(table);
    expect(
      within(table).getByRole("columnheader", { name: "Quantity" })
    ).toBeVisible();
    expect(within(table).getByText("12")).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Edit SANS Training Vouchers" })
    );
    const totalBefore = screen.getByTestId("worksheet-total").textContent;

    fireEvent.change(screen.getAllByLabelText("Count amount")[0], {
      target: { value: "15" },
    });

    expect(screen.getByTestId("worksheet-total").textContent).not.toBe(
      totalBefore
    );
    expect(screen.getByDisplayValue("15")).toBeVisible();
  });

  it("shows Hardware account 62093 in Account Rollup before any Hardware rows exist", () => {
    renderBudgetWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Summary" }));
    const row = screen.getByText("62093").closest("tr");
    expect(row).not.toBeNull();
    expect(within(row!).getByText("Computer Hardware")).toBeVisible();
    expect(within(row!).getByText("$0.00")).toBeVisible();
  });

  it("adds Hardware rows with Training-style columns and quantity-based totals", async () => {
    renderBudgetWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Hardware" }));
    const table = activeWorksheetTable();
    for (const name of [
      "Hardware",
      "Quantity",
      "Unit Cost",
      "Budget Amount",
      "Notes",
      "Actions",
    ]) {
      expect(within(table).getByRole("columnheader", { name })).toBeVisible();
    }
    fireEvent.click(screen.getByRole("button", { name: "Add Row" }));
    fireEvent.change(screen.getByLabelText("Count amount"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Hardware cost"), {
      target: { value: "250" },
    });
    expect(screen.getByTestId("worksheet-total")).toHaveTextContent("$750");
    fireEvent.click(
      screen.getByRole("button", { name: "Done editing New Hardware line" })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Duplicate New Hardware line" })
    );
    expect(screen.getByTestId("worksheet-total")).toHaveTextContent("$1,500");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Open details for New Hardware line",
      })
    );
    expect(
      screen.getByRole("heading", { name: "New Hardware line" })
    ).toBeVisible();
    expect(screen.getByText(/Default:.*62093/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete New Hardware line",
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm delete New Hardware line" })
    );
    await waitFor(() =>
      expect(screen.getByTestId("worksheet-total")).toHaveTextContent("$750")
    );
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Summary" }));
    expect(screen.getByText("Category Summary")).toBeVisible();
    expect(screen.getByText("62093")).toBeVisible();
    expect(screen.getByText("Computer Hardware")).toBeVisible();
    confirm.mockRestore();
  });

  it("keeps conference worksheet columns focused", () => {
    renderBudgetWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Conferences" }));

    const table = activeWorksheetTable();
    expectNoRemovedWorksheetHeaders(table);
    expect(
      within(table).getByRole("columnheader", { name: "Conference" })
    ).toBeVisible();
    expect(
      within(table).getByRole("columnheader", { name: "Attendees" })
    ).toBeVisible();
    expect(
      within(table).getByRole("columnheader", { name: "Registration Fee" })
    ).toBeVisible();
    expect(
      within(table).queryByRole("columnheader", { name: "Purpose" })
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByRole("columnheader", { name: "Owner" })
    ).not.toBeInTheDocument();
  });

  it("renders organizational dues rows even when detail data is missing", () => {
    renderBudgetWorkspaceWithData({
      ...budgetWorkspaceData,
      membershipDetails: [],
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Organizational Dues" })
    );

    const table = activeWorksheetTable();
    expect(
      within(table).getAllByText("Security Memberships and Dues").length
    ).toBeGreaterThan(0);
    expect(within(table).getByText(/Total \([1-9]\d*\)/)).toBeVisible();
  });

  it("shows category and account rollups without unsupported workflow controls", () => {
    renderBudgetWorkspace();

    expect(screen.getByText("Category Summary")).toBeVisible();
    expect(screen.getByText("Account Rollup")).toBeVisible();
    expect(screen.queryByLabelText("Scenario")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Roll Forward" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Maintenance Renewals" })
    ).not.toBeInTheDocument();
  });

  it("opens a detail drawer for a budget row", () => {
    renderBudgetWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Software" }));
    fireEvent.click(
      within(activeWorksheetTable()).getByRole("button", {
        name: "Open details for OneTrust Platform Enterprise",
      })
    );

    expect(
      screen.getByRole("heading", { name: "OneTrust Platform Enterprise" })
    ).toBeVisible();
    expect(screen.getByText("Row-level account override")).toBeVisible();
  });

  it("confirms a budget line before sending it to maintenance", () => {
    renderBudgetWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Software" }));
    const addButtons = screen.getAllByRole("button", { name: "Add Row" });
    fireEvent.click(addButtons[addButtons.length - 1]);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Send New Software and SaaS line to Maintenance",
      })
    );

    expect(
      screen.getByRole("heading", { name: "Send to Maintenance" })
    ).toBeVisible();
    expect(screen.getByText("Product or service")).toBeVisible();
    expect(screen.queryByText("Owner")).not.toBeInTheDocument();
    expect(screen.queryByText("Financial account")).not.toBeInTheDocument();
  });

  it("persists a Maintenance transfer and reconciles the linked row without refreshing", async () => {
    const authoritativeRenewal = budgetWorkspaceData.maintenanceRenewals.find(
      (renewal) => renewal.linkedAnnualFinancialId === "fy27-onetrust"
    );
    if (!authoritativeRenewal) {
      throw new Error("Expected the OneTrust renewal fixture.");
    }
    const initialData = {
      ...budgetWorkspaceData,
      maintenanceRenewals: budgetWorkspaceData.maintenanceRenewals.filter(
        (renewal) => renewal.id !== authoritativeRenewal.id
      ),
    };
    budgetActionsMock.sendBudgetToMaintenanceAction.mockResolvedValue({
      ok: true,
      message: "Maintenance Renewal created and linked.",
      data: {
        renewal: authoritativeRenewal,
        created: true,
      },
    });

    render(<BudgetWorkspace initialData={initialData} />);
    fireEvent.click(screen.getByRole("button", { name: "Software" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Send OneTrust Platform Enterprise to Maintenance",
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Create Link" }));

    await waitFor(() => {
      expect(
        budgetActionsMock.sendBudgetToMaintenanceAction
      ).toHaveBeenCalledWith("fy27-onetrust");
    });
    expect(
      screen.queryByRole("heading", { name: "Send to Maintenance" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "View Maintenance for OneTrust Platform Enterprise",
      })
    ).toBeVisible();
    expect(routerMock.refresh).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", {
        name: "View Maintenance for OneTrust Platform Enterprise",
      })
    );
    expect(routerMock.push).toHaveBeenCalledWith(
      `/renewals?renewal=${authoritativeRenewal.id}`
    );
  });

  it("keeps the confirmation open and reports a persistence failure", async () => {
    const initialData = {
      ...budgetWorkspaceData,
      maintenanceRenewals: budgetWorkspaceData.maintenanceRenewals.filter(
        (renewal) => renewal.linkedAnnualFinancialId !== "fy27-onetrust"
      ),
    };
    budgetActionsMock.sendBudgetToMaintenanceAction.mockResolvedValue({
      ok: false,
      message: "You do not have permission to create this Renewal.",
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<BudgetWorkspace initialData={initialData} />);
    fireEvent.click(screen.getByRole("button", { name: "Software" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Send OneTrust Platform Enterprise to Maintenance",
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Create Link" }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "You do not have permission to create this Renewal."
      );
    });
    expect(
      screen.getByRole("heading", { name: "Send to Maintenance" })
    ).toBeVisible();
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });
});
