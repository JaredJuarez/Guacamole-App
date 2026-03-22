import type { Pool } from "mysql2/promise";

export class AuditRepository {
  constructor(private readonly db: Pool) {}

  async log(input: {
    actorUserId: number | null;
    action: string;
    entityType: string;
    entityId: string;
    details: unknown;
  }): Promise<void> {
    await this.db.execute(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details_json)
       VALUES (?, ?, ?, ?, ?)`,
      [input.actorUserId, input.action, input.entityType, input.entityId, JSON.stringify(input.details)]
    );
  }
}

