import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { env } from "../config/env.js";
import { sha256Hex } from "../lib/hash.js";

export class MediaService {
  async prepareUpload(file: Express.Multer.File) {
    const sha256 = sha256Hex(file.buffer);
    const suffix = extname(file.originalname) || ".bin";
    const objectKey = `${randomUUID()}${suffix}`;
    const storageUrl = `${env.PUBLIC_STORAGE_BASE_URL.replace(/\/$/, "")}/${objectKey}`;

    return {
      sha256,
      mimeType: file.mimetype,
      storageUrl
    };
  }
}

