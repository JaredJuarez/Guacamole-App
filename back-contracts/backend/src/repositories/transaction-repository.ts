import type { Pool } from "mysql2/promise";

export class TransactionRepository {
  constructor(private readonly db: Pool) {}

  async create(input: {
    batchId: number;
    checkpointId: number | null;
    contractId: string | null;
    operation: "create_batch" | "add_checkpoint" | "close_batch";
    txHash: string;
    status: "pending" | "success" | "failed";
    payloadJson: unknown;
  }): Promise<void> {
    await this.db.execute(
      `INSERT INTO blockchain_transactions (batch_id, checkpoint_id, contract_id, operation, tx_hash, status, payload_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.batchId,
        input.checkpointId,
        input.contractId,
        input.operation,
        input.txHash,
        input.status,
        JSON.stringify(input.payloadJson)
      ]
    );
  }
}

