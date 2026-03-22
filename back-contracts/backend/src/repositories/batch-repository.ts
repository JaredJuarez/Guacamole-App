import type {
  Batch,
  BatchCheckpoint,
  BatchRole,
  BatchStatus,
  MediaAsset
} from "@guacamole/shared";
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

type BatchRow = RowDataPacket & {
  id: number;
  uuid: string;
  contract_id: string | null;
  producer_id: number;
  status: BatchStatus;
  current_role: BatchRole;
  product_name: string;
  variety: string | null;
  weight_kg: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

type CheckpointRow = RowDataPacket & {
  id: number;
  batch_id: number;
  actor_id: number;
  role: BatchRole;
  status: BatchStatus;
  location_hash: string;
  photo_hash: string;
  tx_hash: string | null;
  db_ref: string;
  checkpoint_order: number;
  timestamp_onchain: Date | null;
  created_at: Date;
};

type MediaAssetRow = RowDataPacket & {
  id: number;
  batch_id: number;
  checkpoint_id: number | null;
  storage_url: string;
  sha256: string;
  mime_type: string;
  created_at: Date;
};

export class BatchRepository {
  constructor(private readonly db: Pool) {}

  async createBatch(input: {
    uuid: string;
    producerId: number;
    status: BatchStatus;
    currentRole: BatchRole;
    productName: string;
    variety: string | null;
    weightKg: number | null;
    notes: string | null;
  }): Promise<Batch> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `INSERT INTO batches (uuid, producer_id, status, current_role, product_name, variety, weight_kg, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.uuid,
        input.producerId,
        input.status,
        input.currentRole,
        input.productName,
        input.variety,
        input.weightKg,
        input.notes
      ]
    );
    return this.getBatch(result.insertId);
  }

  async setContract(batchId: number, contractId: string): Promise<void> {
    await this.db.execute(`UPDATE batches SET contract_id = ? WHERE id = ?`, [contractId, batchId]);
  }

  async updateBatchState(batchId: number, role: BatchRole, status: BatchStatus): Promise<void> {
    await this.db.execute(
      `UPDATE batches SET current_role = ?, status = ? WHERE id = ?`,
      [role, status, batchId]
    );
  }

  async getBatch(id: number): Promise<Batch> {
    const [rows] = await this.db.execute<BatchRow[]>(`SELECT * FROM batches WHERE id = ? LIMIT 1`, [id]);
    if (!rows[0]) {
      throw new Error(`Batch ${id} not found`);
    }
    return mapBatch(rows[0]);
  }

  async getBatchByUuid(uuid: string): Promise<Batch | null> {
    const [rows] = await this.db.execute<BatchRow[]>(`SELECT * FROM batches WHERE uuid = ? LIMIT 1`, [uuid]);
    return rows[0] ? mapBatch(rows[0]) : null;
  }

  async createCheckpoint(input: {
    batchId: number;
    actorId: number;
    role: BatchRole;
    status: BatchStatus;
    locationHash: string;
    photoHash: string;
    txHash: string | null;
    dbRef: string;
    checkpointOrder: number;
    timestampOnchain: string | null;
  }): Promise<BatchCheckpoint> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `INSERT INTO batch_checkpoints
       (batch_id, actor_id, role, status, location_hash, photo_hash, tx_hash, db_ref, checkpoint_order, timestamp_onchain)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.batchId,
        input.actorId,
        input.role,
        input.status,
        input.locationHash,
        input.photoHash,
        input.txHash,
        input.dbRef,
        input.checkpointOrder,
        input.timestampOnchain
      ]
    );

    const [rows] = await this.db.execute<CheckpointRow[]>(
      `SELECT * FROM batch_checkpoints WHERE id = ? LIMIT 1`,
      [result.insertId]
    );
    return mapCheckpoint(rows[0]);
  }

  async listCheckpoints(batchId: number): Promise<BatchCheckpoint[]> {
    const [rows] = await this.db.execute<CheckpointRow[]>(
      `SELECT * FROM batch_checkpoints WHERE batch_id = ? ORDER BY checkpoint_order ASC`,
      [batchId]
    );
    return rows.map(mapCheckpoint);
  }

  async countCheckpoints(batchId: number): Promise<number> {
    const [rows] = await this.db.execute<Array<RowDataPacket & { total: number }>>(
      `SELECT COUNT(*) AS total FROM batch_checkpoints WHERE batch_id = ?`,
      [batchId]
    );
    return rows[0]?.total ?? 0;
  }

  async createMediaAsset(input: {
    batchId: number;
    checkpointId: number | null;
    storageUrl: string;
    sha256: string;
    mimeType: string;
  }): Promise<MediaAsset> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `INSERT INTO media_assets (batch_id, checkpoint_id, storage_url, sha256, mime_type)
       VALUES (?, ?, ?, ?, ?)`,
      [input.batchId, input.checkpointId, input.storageUrl, input.sha256, input.mimeType]
    );

    const [rows] = await this.db.execute<MediaAssetRow[]>(
      `SELECT * FROM media_assets WHERE id = ? LIMIT 1`,
      [result.insertId]
    );
    return mapMediaAsset(rows[0]);
  }
}

function mapBatch(row: BatchRow): Batch {
  return {
    id: row.id,
    uuid: row.uuid,
    contractId: row.contract_id,
    producerId: row.producer_id,
    status: row.status,
    currentRole: row.current_role,
    productName: row.product_name,
    variety: row.variety,
    weightKg: row.weight_kg,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function mapCheckpoint(row: CheckpointRow): BatchCheckpoint {
  return {
    id: row.id,
    batchId: row.batch_id,
    actorId: row.actor_id,
    role: row.role,
    status: row.status,
    locationHash: row.location_hash,
    photoHash: row.photo_hash,
    txHash: row.tx_hash,
    dbRef: row.db_ref,
    checkpointOrder: row.checkpoint_order,
    timestampOnchain: row.timestamp_onchain?.toISOString() ?? null,
    createdAt: row.created_at.toISOString()
  };
}

function mapMediaAsset(row: MediaAssetRow): MediaAsset {
  return {
    id: row.id,
    batchId: row.batch_id,
    checkpointId: row.checkpoint_id,
    storageUrl: row.storage_url,
    sha256: row.sha256,
    mimeType: row.mime_type,
    createdAt: row.created_at.toISOString()
  };
}
