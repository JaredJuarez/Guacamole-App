import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { User, UserRole } from "@guacamole/shared";

type UserRow = RowDataPacket & {
  id: number;
  organization_id: number | null;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  wallet_public_key: string;
  created_at: Date;
};

export class UserRepository {
  constructor(private readonly db: Pool) {}

  async create(input: {
    organizationId: number | null;
    email: string;
    passwordHash: string;
    fullName: string;
    role: UserRole;
    walletPublicKey: string;
  }): Promise<User> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `INSERT INTO users (organization_id, email, password_hash, full_name, role, wallet_public_key)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.organizationId,
        input.email,
        input.passwordHash,
        input.fullName,
        input.role,
        input.walletPublicKey
      ]
    );

    return this.findById(result.insertId);
  }

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await this.db.execute<UserRow[]>(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async findById(id: number): Promise<User> {
    const [rows] = await this.db.execute<UserRow[]>(
      `SELECT * FROM users WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!rows[0]) {
      throw new Error(`User ${id} not found`);
    }

    return mapUser(rows[0]);
  }
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    role: row.role,
    walletPublicKey: row.wallet_public_key,
    createdAt: row.created_at.toISOString()
  };
}

