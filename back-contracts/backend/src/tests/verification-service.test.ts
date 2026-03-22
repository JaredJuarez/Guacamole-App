import { describe, expect, it } from "vitest";
import { VerificationService } from "../services/verification-service.js";

describe("VerificationService", () => {
  it("returns pending when batch does not exist", async () => {
    const service = new VerificationService(
      {
        getBatchByUuid: async () => null,
        listCheckpoints: async () => []
      } as never,
      {
        getBatchSummary: async () => null
      } as never
    );

    const result = await service.verifyBatch("missing-batch");
    expect(result.status).toBe("pending");
    expect(result.batchUuid).toBe("missing-batch");
  });
});
