export type UserRole = "admin" | "producer" | "transporter" | "inspector" | "distributor";

export type BatchRole = "producer" | "transporter" | "inspector" | "distributor";

export type BatchStatus =
  | "harvested"
  | "in_transit"
  | "inspected"
  | "delivered"
  | "closed";

export type VerificationStatus = "authenticated" | "inconsistent" | "pending";

export interface Organization {
  id: number;
  name: string;
  taxId: string | null;
  contactEmail: string | null;
  createdAt: string;
}

export interface User {
  id: number;
  organizationId: number | null;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  walletPublicKey: string;
  createdAt: string;
}

export interface Batch {
  id: number;
  uuid: string;
  contractId: string | null;
  producerId: number;
  status: BatchStatus;
  currentRole: BatchRole;
  productName: string;
  variety: string | null;
  weightKg: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BatchCheckpoint {
  id: number;
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
  createdAt: string;
}

export interface MediaAsset {
  id: number;
  batchId: number;
  checkpointId: number | null;
  storageUrl: string;
  sha256: string;
  mimeType: string;
  createdAt: string;
}

export interface BlockchainTransaction {
  id: number;
  batchId: number;
  checkpointId: number | null;
  contractId: string | null;
  operation: "create_batch" | "add_checkpoint" | "close_batch";
  txHash: string;
  status: "pending" | "success" | "failed";
  payloadJson: string;
  createdAt: string;
}

export interface VerificationSummary {
  batchUuid: string;
  contractId: string | null;
  status: VerificationStatus;
  message: string;
  currentStatus: BatchStatus;
  currentRole: BatchRole;
  checkpoints: Array<{
    role: BatchRole;
    status: BatchStatus;
    photoHash: string;
    timestamp: string | null;
  }>;
}

export const ROLE_SEQUENCE: BatchRole[] = [
  "producer",
  "transporter",
  "inspector",
  "distributor"
];

export const STATUS_BY_ROLE: Record<BatchRole, BatchStatus> = {
  producer: "harvested",
  transporter: "in_transit",
  inspector: "inspected",
  distributor: "delivered"
};

export function assertValidRoleTransition(currentRole: BatchRole, nextRole: BatchRole): void {
  const currentIndex = ROLE_SEQUENCE.indexOf(currentRole);
  const nextIndex = ROLE_SEQUENCE.indexOf(nextRole);

  if (currentIndex === -1 || nextIndex === -1) {
    throw new Error("Invalid role transition");
  }

  if (nextIndex !== currentIndex + 1) {
    throw new Error(`Invalid custody transition from ${currentRole} to ${nextRole}`);
  }
}

export function isTerminalStatus(status: BatchStatus): boolean {
  return status === "closed";
}
