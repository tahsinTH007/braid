import { Router, type Request } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { getAuth } from "@clerk/express";
import { put } from "@vercel/blob";
import { BadRequestError, UnauthorizedError } from "../lib/errors.js";

export const uploadRouter = Router();

const uploadsDir = path.join(process.cwd(), "uploads");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new BadRequestError("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

function saveToLocalDisk(file: Express.Multer.File, filename: string, req: Request) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);

  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

uploadRouter.post(
  "/image-upload",
  (req, _res, next) => {
    const auth = getAuth(req);
    if (!auth.userId) {
      next(new UnauthorizedError("Unauthorized"));
      return;
    }
    next();
  },
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new BadRequestError("No file uploaded");
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;

      const url = process.env.BLOB_READ_WRITE_TOKEN
        ? (await put(filename, req.file.buffer, { access: "public" })).url
        : saveToLocalDisk(req.file, filename, req);

      res.status(201).json({ url });
    } catch (error) {
      next(error);
    }
  },
);
