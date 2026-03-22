import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(10),
  MYSQL_HOST: z.string().min(1),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_DATABASE: z.string().min(1),
  MYSQL_USER: z.string().min(1),
  MYSQL_PASSWORD: z.string().min(1),
  STELLAR_NETWORK: z.enum(["local", "testnet", "mainnet"]).default("testnet"),
  STELLAR_RPC_URL: z.string().url(),
  STELLAR_NETWORK_PASSPHRASE: z.string().min(1),
  STELLAR_SECRET_KEY: z.string().optional(),
  STELLAR_FACTORY_CONTRACT_ID: z.string().optional(),
  PUBLIC_STORAGE_BASE_URL: z.string().url().default("https://storage.example.com")
});

export const env = envSchema.parse(process.env);

