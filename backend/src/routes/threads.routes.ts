import { Router } from "express";
import { getAuth } from "@clerk/express";
import { z } from "zod";
import {
  createThread,
  listCategories,
  listThreads,
  parseThreadListFilter,
} from "../modules/threads/thread.repository.js";
import { BadRequestError, UnauthorizedError } from "../lib/errors.js";
import { getUserFromClerk } from "../modules/users/user.service.js";
import {
  createReply,
  deleteReplyById,
  findReplyAuthor,
  getThreadDetailsWithCounts,
  likeThreadOnce,
  listRepliesForThread,
  removeThreadOnce,
} from "../modules/threads/replies.repository.js";
import { createLikeNotification, createReplyNotification } from "../modules/notifications/notifications.service.js";

export const threadsRouter = Router();

const CreatedThreadSchema = z.object({
  title: z.string().trim().min(5).max(200),
  body: z.string().trim().min(10).max(2000),
  categorySlug: z.string().trim().min(1),
});

threadsRouter.get("/categories", async (_req, res, next) => {
  try {
    const extractListOfCategories = await listCategories();

    res.json({ data: extractListOfCategories });
  } catch (error) {
    next(error);
  }
});

threadsRouter.post("/threads", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const parsedBody = CreatedThreadSchema.parse(req.body);

    const profile = await getUserFromClerk(auth.userId);

    const newlyCreatedThread = await createThread({
      categorySlug: parsedBody.categorySlug,
      authorUserId: profile.user.id,
      title: parsedBody.title,
      body: parsedBody.body,
    });

    res.status(201).json({
      data: newlyCreatedThread,
    });
  } catch (error) {
    next(error);
  }
});

threadsRouter.get("/threads/:threadId", async (req, res, next) => {
  try {
    const threadId = Number(req.params.threadId);

    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequestError("Invalid Thread id");
    }

    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const profile = await getUserFromClerk(auth.userId);

    const viewerUserId = profile.user.id;

    const thread = await getThreadDetailsWithCounts({ threadId, viewerUserId });

    res.json({ data: thread });
  } catch (error) {
    next(error);
  }
});

threadsRouter.get("/threads", async (req, res, next) => {
  try {
    const filter = parseThreadListFilter({
      page: req.query.page,
      pageSize: req.query.pageSize,
      category: req.query.category,
      q: req.query.q,
      sort: req.query.sort,
    });

    const extractListOfThreads = await listThreads(filter);

    res.json({ data: extractListOfThreads });
  } catch (error) {
    next(error);
  }
});

threadsRouter.get("/threads/:threadId/replies", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const threadId = Number(req.params.threadId);

    const replies = await listRepliesForThread(threadId);

    res.json({ data: replies });
  } catch (error) {
    next(error);
  }
});

threadsRouter.post("/threads/:threadId/replies", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const threadId = Number(req.params.threadId);

    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequestError("Invalid thread id");
    }

    const bodyRow = typeof req.body?.body === "string" ? req.body.body : "";

    if (bodyRow.trim().length <= 2) {
      throw new BadRequestError("Reply is too short");
    }

    const profile = await getUserFromClerk(auth.userId);

    const reply = await createReply({
      threadId,
      authorUserId: profile.user.id,
      body: bodyRow,
    });

    await createReplyNotification({ threadId, actorUserId: profile.user.id });

    res.status(201).json({ data: reply });
  } catch (error) {
    next(error);
  }
});

threadsRouter.delete("/replies/:replyId", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const replyId = Number(req.params.replyId);
    if (!Number.isInteger(replyId) || replyId <= 0) {
      throw new BadRequestError("Invalid replyId");
    }

    const profile = await getUserFromClerk(auth.userId);
    const authorUserId = await findReplyAuthor(replyId);

    if (authorUserId !== profile.user.id) {
      throw new UnauthorizedError("You can only delete your own replies");
    }

    await deleteReplyById(replyId);

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

threadsRouter.post("/threads/:threadId/like", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const threadId = Number(req.params.threadId);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequestError("Invalid thread Id");
    }

    const profile = await getUserFromClerk(auth.userId);

    await likeThreadOnce({
      threadId,
      userId: profile.user.id,
    });

    await createLikeNotification({
      threadId,
      actorUserId: profile.user.id,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

threadsRouter.delete("/threads/:threadId/like", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }
    const threadId = Number(req.params.threadId);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequestError("Invalid thread Id");
    }

    const profile = await getUserFromClerk(auth.userId);

    await removeThreadOnce({
      threadId,
      userId: profile.user.id,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
