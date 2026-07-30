import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveDeploymentAction } from "@/app/deployment/actions";
import { emptyActionResult } from "@/lib/server/action-result";

const cacheMock = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const deploymentServiceMock = vi.hoisted(() => ({
  addDeploymentUsageMeasurement: vi.fn(),
  saveDeployment: vi.fn(),
}));

vi.mock("next/cache", () => cacheMock);
vi.mock("@/lib/server/deployment-service", () => deploymentServiceMock);

describe("Deployment actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates only Deployment after a save", async () => {
    deploymentServiceMock.saveDeployment.mockResolvedValue("deployment-1");

    const result = await saveDeploymentAction(
      emptyActionResult,
      new FormData()
    );

    expect(result.ok).toBe(true);
    expect(cacheMock.revalidatePath.mock.calls).toEqual([["/deployment"]]);
    expect(cacheMock.revalidateTag).toHaveBeenCalledWith(
      "dashboard:reporting",
      "max"
    );
  });
});
