import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { type BatchRole, type BatchStatus, isTerminalStatus } from "@guacamole/shared";
import { assertCheckpointTransition, getInitialRole, nextStatusForRole } from "../lib/custody.js";
import { HttpError } from "../lib/http-error.js";
import { AuditRepository } from "../repositories/audit-repository.js";
import { BatchRepository } from "../repositories/batch-repository.js";
import { TransactionRepository } from "../repositories/transaction-repository.js";
import { UserRepository } from "../repositories/user-repository.js";
import { MediaService } from "./media-service.js";
import { StellarService, buildCheckpointReference } from "./stellar-service.js";

function formatMysqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export class BatchService {
  constructor(
    private readonly batches: BatchRepository,
    private readonly users: UserRepository,
    private readonly audits: AuditRepository,
    private readonly transactions: TransactionRepository,
    private readonly media: MediaService,
    private readonly stellar: StellarService
  ) {}

  async createBatch(input: {
    producerId: number;
    productName: string;
    variety: string | null;
    weightKg: number | null;
    notes: string | null;
    locationHash: string;
    file: Express.Multer.File;
  }) {
    const producer = await this.users.findById(input.producerId);
    const batch = await this.batches.createBatch({
      uuid: randomUUID(),
      producerId: input.producerId,
      status: "harvested",
      currentRole: getInitialRole(),
      productName: input.productName,
      variety: input.variety,
      weightKg: input.weightKg,
      notes: input.notes
    });

    const upload = await this.media.prepareUpload(input.file);
    const media = await this.batches.createMediaAsset({
      batchId: batch.id,
      checkpointId: null,
      storageUrl: upload.storageUrl,
      sha256: upload.sha256,
      mimeType: upload.mimeType
    });

    const onchain = await this.stellar.createBatchContract({
      batchUuid: batch.uuid,
      producerWallet: producer.walletPublicKey,
      photoHash: upload.sha256,
      dbRef: media.storageUrl,
      timestamp: Math.floor(Date.now() / 1000),
      locationHash: input.locationHash
    });

    await this.batches.setContract(batch.id, onchain.contractId);
    const checkpoint = await this.batches.createCheckpoint({
      batchId: batch.id,
      actorId: producer.id,
      role: "producer",
      status: "harvested",
      locationHash: input.locationHash,
      photoHash: upload.sha256,
      txHash: onchain.txHash,
      dbRef: media.storageUrl,
      checkpointOrder: 0,
      timestampOnchain: formatMysqlDateTime(new Date())
    });

    await this.transactions.create({
      batchId: batch.id,
      checkpointId: checkpoint.id,
      contractId: onchain.contractId,
      operation: "create_batch",
      txHash: onchain.txHash,
      status: "success",
      payloadJson: { batchUuid: batch.uuid, producerWallet: producer.walletPublicKey }
    });

    await this.audits.log({
      actorUserId: producer.id,
      action: "batch.created",
      entityType: "batch",
      entityId: String(batch.id),
      details: { batchUuid: batch.uuid, contractId: onchain.contractId }
    });

    return {
      ...(await this.batches.getBatch(batch.id)),
      checkpoint,
      contractId: onchain.contractId
    };
  }

  async addCheckpoint(input: {
    batchId: number;
    actorId: number;
    role: BatchRole;
    locationHash: string;
    file: Express.Multer.File;
  }) {
    const batch = await this.batches.getBatch(input.batchId);
    if (isTerminalStatus(batch.status)) {
      throw new HttpError(409, "Batch is already closed");
    }

    assertCheckpointTransition(batch.currentRole, input.role);
    const actor = await this.users.findById(input.actorId);
    const status = nextStatusForRole(input.role);
    const order = await this.batches.countCheckpoints(batch.id);
    const upload = await this.media.prepareUpload(input.file);
    const media = await this.batches.createMediaAsset({
      batchId: batch.id,
      checkpointId: null,
      storageUrl: upload.storageUrl,
      sha256: upload.sha256,
      mimeType: upload.mimeType
    });

    const txRef = buildCheckpointReference({
      id: order,
      batchId: batch.id,
      photoHash: upload.sha256
    });

    const onchain = await this.stellar.addCheckpoint({
      contractId: batch.contractId ?? `pending-${batch.uuid}`,
      actorWallet: actor.walletPublicKey,
      role: input.role,
      photoHash: upload.sha256,
      timestamp: Math.floor(Date.now() / 1000),
      locationHash: input.locationHash,
      status,
      dbRef: media.storageUrl,
      txHashReference: txRef
    });

    const checkpoint = await this.batches.createCheckpoint({
      batchId: batch.id,
      actorId: actor.id,
      role: input.role,
      status,
      locationHash: input.locationHash,
      photoHash: upload.sha256,
      txHash: onchain.txHash,
      dbRef: media.storageUrl,
      checkpointOrder: order,
      timestampOnchain: formatMysqlDateTime(new Date())
    });

    await this.batches.updateBatchState(batch.id, input.role, status);
    await this.transactions.create({
      batchId: batch.id,
      checkpointId: checkpoint.id,
      contractId: batch.contractId,
      operation: "add_checkpoint",
      txHash: onchain.txHash,
      status: "success",
      payloadJson: { role: input.role, actorWallet: actor.walletPublicKey }
    });

    await this.audits.log({
      actorUserId: actor.id,
      action: "batch.checkpoint_added",
      entityType: "batch",
      entityId: String(batch.id),
      details: { checkpointId: checkpoint.id, role: input.role }
    });

    return checkpoint;
  }

  async getBatch(batchId: number) {
    const batch = await this.batches.getBatch(batchId);
    const checkpoints = await this.batches.listCheckpoints(batchId);
    return { ...batch, checkpoints };
  }

  async getBatchHistory(batchId: number) {
    return this.batches.listCheckpoints(batchId);
  }

  async closeBatch(batchId: number, finalStatus: BatchStatus) {
    const batch = await this.batches.getBatch(batchId);
    if (finalStatus !== "closed") {
      throw new HttpError(400, "Final status must be closed");
    }

    await this.batches.updateBatchState(batchId, batch.currentRole, "closed");
    await this.audits.log({
      actorUserId: null,
      action: "batch.closed",
      entityType: "batch",
      entityId: String(batchId),
      details: { finalStatus }
    });

    return this.batches.getBatch(batchId);
  }
}
