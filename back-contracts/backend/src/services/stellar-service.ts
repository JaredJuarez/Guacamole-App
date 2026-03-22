import { createHash } from "node:crypto";
import * as StellarSdk from "@stellar/stellar-sdk";
import type { BatchCheckpoint, BatchStatus } from "@guacamole/shared";
import { rpc, stellarConfig } from "../config/stellar.js";
import { HttpError } from "../lib/http-error.js";

function hashFallback(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function ensureConfig(value: string, name: string): string {
  if (!value) {
    throw new HttpError(500, `Missing ${name}`);
  }
  return value;
}

export class StellarService {
  async createBatchContract(input: {
    batchUuid: string;
    producerWallet: string;
    photoHash: string;
    dbRef: string;
    timestamp: number;
    locationHash: string;
  }): Promise<{ contractId: string; txHash: string }> {
    if (!stellarConfig.secretKey || !stellarConfig.factoryContractId) {
      return {
        contractId: `pending-${input.batchUuid}`,
        txHash: hashFallback(input)
      };
    }

    const source = StellarSdk.Keypair.fromSecret(ensureConfig(stellarConfig.secretKey, "STELLAR_SECRET_KEY"));
    const account = await rpc.getAccount(source.publicKey());
    const contract = new StellarSdk.Contract(
      ensureConfig(stellarConfig.factoryContractId, "STELLAR_FACTORY_CONTRACT_ID")
    );

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: stellarConfig.networkPassphrase
    })
      .addOperation(
        contract.call(
          "create_batch",
          StellarSdk.nativeToScVal(input.batchUuid, { type: "string" }),
          StellarSdk.Address.fromString(input.producerWallet).toScVal(),
          StellarSdk.nativeToScVal(Buffer.from(input.photoHash, "hex"), { type: "bytes" }),
          StellarSdk.nativeToScVal(input.dbRef, { type: "string" }),
          StellarSdk.nativeToScVal(input.timestamp, { type: "u64" }),
          StellarSdk.nativeToScVal(Buffer.from(input.locationHash, "hex"), { type: "bytes" })
        )
      )
      .setTimeout(30)
      .build();

    const simulation = await rpc.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
      throw new HttpError(502, simulation.error);
    }

    const contractId = this.parseContractAddress(simulation.result?.retval, input.batchUuid);
    const prepared = StellarSdk.rpc.assembleTransaction(tx, simulation).build();
    prepared.sign(source);

    const sent = await rpc.sendTransaction(prepared);
    this.ensureTransactionAccepted(sent);

    return {
      contractId,
      txHash: sent.hash
    };
  }

  async addCheckpoint(input: {
    contractId: string;
    actorWallet: string;
    role: string;
    photoHash: string;
    timestamp: number;
    locationHash: string;
    status: BatchStatus;
    dbRef: string;
    txHashReference: string;
  }): Promise<{ txHash: string }> {
    if (!stellarConfig.secretKey || input.contractId.startsWith("pending-")) {
      return { txHash: hashFallback(input) };
    }

    const source = StellarSdk.Keypair.fromSecret(stellarConfig.secretKey);
    const account = await rpc.getAccount(source.publicKey());
    const contract = new StellarSdk.Contract(input.contractId);

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: stellarConfig.networkPassphrase
    })
      .addOperation(
        contract.call(
          "add_checkpoint",
          StellarSdk.Address.fromString(input.actorWallet).toScVal(),
          StellarSdk.nativeToScVal(input.role, { type: "string" }),
          StellarSdk.nativeToScVal(Buffer.from(input.photoHash, "hex"), { type: "bytes" }),
          StellarSdk.nativeToScVal(input.timestamp, { type: "u64" }),
          StellarSdk.nativeToScVal(Buffer.from(input.locationHash, "hex"), { type: "bytes" }),
          StellarSdk.nativeToScVal(input.status, { type: "string" }),
          StellarSdk.nativeToScVal(input.dbRef, { type: "string" }),
          StellarSdk.nativeToScVal(Buffer.from(input.txHashReference, "hex"), { type: "bytes" })
        )
      )
      .setTimeout(30)
      .build();

    const simulation = await rpc.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
      throw new HttpError(502, simulation.error);
    }

    const prepared = StellarSdk.rpc.assembleTransaction(tx, simulation).build();
    prepared.sign(source);
    const sent = await rpc.sendTransaction(prepared);
    this.ensureTransactionAccepted(sent);

    return { txHash: sent.hash };
  }

  async getBatchSummary(contractId: string): Promise<Record<string, unknown> | null> {
    if (!stellarConfig.secretKey || contractId.startsWith("pending-")) {
      return null;
    }

    const contract = new StellarSdk.Contract(contractId);
    const account = await rpc.getAccount(StellarSdk.Keypair.fromSecret(stellarConfig.secretKey).publicKey());
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: stellarConfig.networkPassphrase
    })
      .addOperation(contract.call("get_summary"))
      .setTimeout(30)
      .build();

    const simulation = await rpc.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
      return null;
    }

    return {
      contractId,
      result: simulation.result?.retval ? StellarSdk.scValToNative(simulation.result.retval) : null
    };
  }

  private parseContractAddress(result: StellarSdk.xdr.ScVal | undefined, batchUuid: string): string {
    if (!result) {
      return `submitted-${batchUuid}`;
    }

    try {
      return StellarSdk.Address.fromScVal(result).toString();
    } catch {
      return `submitted-${batchUuid}`;
    }
  }

  private ensureTransactionAccepted(response: StellarSdk.rpc.Api.SendTransactionResponse): void {
    if (response.status === "ERROR") {
      const detail = response.errorResult ? response.errorResult.toXDR("base64") : "unknown_error";
      throw new HttpError(502, `Stellar sendTransaction failed: ${detail}`);
    }

    if (response.status === "TRY_AGAIN_LATER") {
      throw new HttpError(503, "Stellar RPC asked to retry the transaction later");
    }
  }
}

export function buildCheckpointReference(checkpoint: Pick<BatchCheckpoint, "id" | "batchId" | "photoHash">): string {
  return createHash("sha256")
    .update(`${checkpoint.batchId}:${checkpoint.id}:${checkpoint.photoHash}`)
    .digest("hex");
}
