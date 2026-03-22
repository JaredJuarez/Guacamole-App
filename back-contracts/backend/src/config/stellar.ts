import * as StellarSdk from "@stellar/stellar-sdk";
import { env } from "./env.js";

export const stellarConfig = {
  network: env.STELLAR_NETWORK,
  rpcUrl: env.STELLAR_RPC_URL,
  networkPassphrase: env.STELLAR_NETWORK_PASSPHRASE,
  factoryContractId: env.STELLAR_FACTORY_CONTRACT_ID ?? "",
  secretKey: env.STELLAR_SECRET_KEY ?? ""
};

export const rpc = new StellarSdk.rpc.Server(stellarConfig.rpcUrl);

