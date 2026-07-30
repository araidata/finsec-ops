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

  it("passes the server-issued Deployment version to the service", async () => {
    deploymentServiceMock.saveDeployment.mockResolvedValue("deployment-1");
    const formData = new FormData();
    formData.set("expectedUpdatedAt", "2026-07-29T12:00:00.000Z");

    await saveDeploymentAction(emptyActionResult, formData);

    expect(deploymentServiceMock.saveDeployment).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedUpdatedAt: "2026-07-29T12:00:00.000Z",
      })
    );
  });
});
