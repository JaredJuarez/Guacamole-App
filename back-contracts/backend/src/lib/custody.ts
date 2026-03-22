import {
  ROLE_SEQUENCE,
  STATUS_BY_ROLE,
  assertValidRoleTransition,
  type BatchRole,
  type BatchStatus
} from "@guacamole/shared";

export function getInitialRole(): BatchRole {
  return ROLE_SEQUENCE[0];
}

export function nextStatusForRole(role: BatchRole): BatchStatus {
  return STATUS_BY_ROLE[role];
}

export function assertCheckpointTransition(currentRole: BatchRole, nextRole: BatchRole): void {
  assertValidRoleTransition(currentRole, nextRole);
}

