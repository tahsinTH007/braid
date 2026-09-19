import { Router } from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { getAuth } from "@clerk/express";
import { BadRequestError, UnauthorizedError } from "../lib/errors.js";

export const uploadRouter = Router();

const uploadsDir = path.join(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new BadRequestError("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

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
  (req, res, next) => {
    try {
      if (!req.file) {
        throw new BadRequestError("No file uploaded");
      }

      const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

      res.status(201).json({ url });
    } catch (error) {
      next(error);
    }
  },
);
