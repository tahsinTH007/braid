import { getAuth } from "@clerk/express";
import { Router } from "express";
import { getUserFromClerk } from "../modules/users/user.service.js";
import {
  createDirectMessage,
  listChatUsers,
  listDirectMessages,
  touchLastSeen,
} from "../modules/chat/chat.service.js";
import { getIo } from "../realtime/io.js";
import { BadRequestError, UnauthorizedError } from "../lib/errors.js";

export const chatRouter = Router();

chatRouter.post("/heartbeat", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const profile = await getUserFromClerk(auth.userId);
    await touchLastSeen(profile.user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

chatRouter.get("/users", async (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const profile = await getUserFromClerk(auth.userId);
    const currentUserId = profile.user.id as number;

    const users = await listChatUsers(currentUserId);

    res.json({ data: users });
  } catch (err) {
    next(err);
  }
});

chatRouter.get(
  "/conversations/:otherUserId/messages",
  async (req, res, next) => {
    try {
      const auth = getAuth(req);

      if (!auth.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const profile = await getUserFromClerk(auth.userId);
      const currentUserId = profile.user.id as number;

      const rawOtherUserId = req.params.otherUserId;
      const otherUserId = Number(rawOtherUserId);

      const limitParam = req.query.limit;
      const limit =
        typeof limitParam === "string" ? parseInt(limitParam, 10) : 100;

      const messages = await listDirectMessages({
        userId: currentUserId,
        otherUserId,
        limit: limit || 50,
      });

      res.json({ data: messages });
    } catch (err) {
      next(err);
    }
  }
);

chatRouter.post(
  "/conversations/:otherUserId/messages",
  async (req, res, next) => {
    try {
      const auth = getAuth(req);
      if (!auth.userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const profile = await getUserFromClerk(auth.userId);
      const currentUserId = profile.user.id as number;

      const otherUserId = Number(req.params.otherUserId);
      if (!Number.isInteger(otherUserId) || otherUserId <= 0) {
        throw new BadRequestError("Invalid user id");
      }

      const body =
        typeof req.body?.body === "string" ? req.body.body : null;
      const imageUrl =
        typeof req.body?.imageUrl === "string" ? req.body.imageUrl : null;

      const message = await createDirectMessage({
        senderUserId: currentUserId,
        recipientUserId: otherUserId,
        body,
        imageUrl,
      });

      const io = getIo();
      if (io) {
        io.to(`dm:user:${currentUserId}`)
          .to(`dm:user:${otherUserId}`)
          .emit("dm:message", message);
      }

      res.status(201).json({ data: message });
    } catch (err) {
      next(err);
    }
  }
);
