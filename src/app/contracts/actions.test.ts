import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createRenewalFromContractAction,
  saveContractWithLinesAction,
} from "@/app/contracts/actions";
import { emptyActionResult } from "@/lib/server/action-result";

const cacheMock = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const contractServiceMock = vi.hoisted(() => ({
  createMaintenanceRenewalFromContract: vi.fn(),
  createNewContractTermFromRenewal: vi.fn(),
  deleteContract: vi.fn(),
  deleteContractLineItem: vi.fn(),
  duplicateContractLineItem: vi.fn(),
  pushContractToBudget: vi.fn(),
  reorderContractLineItems: vi.fn(),
  saveContract: vi.fn(),
  saveContractLineItem: vi.fn(),
  saveContractLineItems: vi.fn(),
  saveContractWithLineItems: vi.fn(),
}));

vi.mock("next/cache", () => cacheMock);
vi.mock("@/lib/server/contract-service", () => contractServiceMock);

describe("Contract actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates only Contracts for an ordinary save", async () => {
    contractServiceMock.saveContractWithLineItems.mockResolvedValue(
      "contract-1"
    );
    const formData = new FormData();
    formData.set("lineCount", "0");

    const result = await saveContractWithLinesAction(
      emptyActionResult,
      formData
    );

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ id: "contract-1" });
    expect(cacheMock.revalidatePath.mock.calls).toEqual([["/contracts"]]);
  });

  it("also invalidates Renewals for the explicit renewal handoff", async () => {
    contractServiceMock.createMaintenanceRenewalFromContract.mockResolvedValue(
      "renewal-1"
    );
    const formData = new FormData();
    formData.set("contractId", "contract-1");

    const result = await createRenewalFromContractAction(
      emptyActionResult,
      formData
    );

    expect(result.ok).toBe(true);
    expect(cacheMock.revalidatePath.mock.calls).toEqual([
      ["/contracts"],
      ["/renewals"],
    ]);
  });
});
