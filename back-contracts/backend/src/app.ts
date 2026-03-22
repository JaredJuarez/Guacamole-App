import express from "express";
import multer from "multer";
import { z } from "zod";
import { pool } from "./config/database.js";
import { asyncHandler } from "./lib/async-handler.js";
import { HttpError } from "./lib/http-error.js";
import { requireAuth, requireRole, type AuthenticatedRequest } from "./middleware/auth.js";
import { AuditRepository } from "./repositories/audit-repository.js";
import { BatchRepository } from "./repositories/batch-repository.js";
import { TransactionRepository } from "./repositories/transaction-repository.js";
import { UserRepository } from "./repositories/user-repository.js";
import { AuthService } from "./services/auth-service.js";
import { BatchService } from "./services/batch-service.js";
import { MediaService } from "./services/media-service.js";
import { StellarService } from "./services/stellar-service.js";
import { VerificationService } from "./services/verification-service.js";

const upload = multer({ storage: multer.memoryStorage() });

const userRepository = new UserRepository(pool);
const batchRepository = new BatchRepository(pool);
const auditRepository = new AuditRepository(pool);
const transactionRepository = new TransactionRepository(pool);
const mediaService = new MediaService();
const stellarService = new StellarService();
const authService = new AuthService(userRepository);
const batchService = new BatchService(
  batchRepository,
  userRepository,
  auditRepository,
  transactionRepository,
  mediaService,
  stellarService
);
const verificationService = new VerificationService(batchRepository, stellarService);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const registerSchema = z.object({
  organizationId: z.number().nullable().default(null),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(["admin", "producer", "transporter", "inspector", "distributor"]),
  walletPublicKey: z.string().min(8)
});

const createBatchSchema = z.object({
  producerId: z.coerce.number().int().positive(),
  productName: z.string().min(1),
  variety: z.string().optional(),
  weightKg: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
  locationHash: z.string().length(64)
});

const checkpointSchema = z.object({
  actorId: z.coerce.number().int().positive(),
  role: z.enum(["producer", "transporter", "inspector", "distributor"]),
  locationHash: z.string().length(64)
});

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "guacamole-backend" });
  });

  app.post("/auth/login", asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    res.json(result);
  }));

  app.post("/users", asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body);
    res.status(201).json(result);
  }));

  app.post(
    "/batches",
    requireAuth,
    requireRole("admin", "producer"),
    upload.single("photo"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      if (!req.file) {
        throw new HttpError(400, "Missing photo file");
      }
      const body = createBatchSchema.parse(req.body);
      const result = await batchService.createBatch({
        producerId: body.producerId,
        productName: body.productName,
        variety: body.variety ?? null,
        weightKg: body.weightKg ?? null,
        notes: body.notes ?? null,
        locationHash: body.locationHash,
        file: req.file
      });
      res.status(201).json(result);
    })
  );

  app.get("/batches/:id", requireAuth, asyncHandler(async (req, res) => {
    const result = await batchService.getBatch(Number(req.params.id));
    res.json(result);
  }));

  app.get("/batches/:id/history", requireAuth, asyncHandler(async (req, res) => {
    const result = await batchService.getBatchHistory(Number(req.params.id));
    res.json(result);
  }));

  app.post(
    "/batches/:id/checkpoints",
    requireAuth,
    requireRole("admin", "transporter", "inspector", "distributor"),
    upload.single("photo"),
    asyncHandler(async (req, res) => {
      if (!req.file) {
        throw new HttpError(400, "Missing photo file");
      }
      const body = checkpointSchema.parse(req.body);
      const result = await batchService.addCheckpoint({
        batchId: Number(req.params.id),
        actorId: body.actorId,
        role: body.role,
        locationHash: body.locationHash,
        file: req.file
      });
      res.status(201).json(result);
    })
  );

  app.get("/verify/:batchId", asyncHandler(async (req, res) => {
    const result = await verificationService.verifyBatch(String(req.params.batchId));
    res.json(result);
  }));

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: error.flatten() });
      return;
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  });

  return app;
}
