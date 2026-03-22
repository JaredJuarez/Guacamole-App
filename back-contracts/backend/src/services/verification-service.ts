import type { VerificationSummary } from "@guacamole/shared";
import { BatchRepository } from "../repositories/batch-repository.js";
import { StellarService } from "./stellar-service.js";

export class VerificationService {
  constructor(
    private readonly batches: BatchRepository,
    private readonly stellar: StellarService
  ) {}

  async verifyBatch(batchUuid: string): Promise<VerificationSummary> {
    const batch = await this.batches.getBatchByUuid(batchUuid);
    if (!batch) {
      return {
        batchUuid,
        contractId: null,
        status: "pending",
        message: "Batch not found",
        currentStatus: "harvested",
        currentRole: "producer",
        checkpoints: []
      };
    }

    const checkpoints = await this.batches.listCheckpoints(batch.id);
    const latest = checkpoints.at(-1);
    const onchain = batch.contractId ? await this.stellar.getBatchSummary(batch.contractId) : null;

    const status =
      latest && latest.txHash && batch.contractId
        ? "authenticated"
        : onchain === null
          ? "pending"
          : "inconsistent";

    return {
      batchUuid,
      contractId: batch.contractId,
      status,
      message:
        status === "authenticated"
          ? "Hashes y trazabilidad consistentes"
          : status === "pending"
            ? "Pendiente de reconciliacion on-chain"
            : "Inconsistencia entre el backend y la cadena",
      currentStatus: batch.status,
      currentRole: batch.currentRole,
      checkpoints: checkpoints.map((checkpoint) => ({
        role: checkpoint.role,
        status: checkpoint.status,
        photoHash: checkpoint.photoHash,
        timestamp: checkpoint.timestampOnchain
      }))
    };
  }
}

