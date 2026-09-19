import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { getUserFromClerk } from "../modules/users/user.service.js";
import { corsOrigins } from "../config/env.js";

let io: Server | null = null;

export function initIo(httpServer: HttpServer) {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    try {
      const clerkUserId = socket.handshake.auth?.userId;

      if (!clerkUserId || typeof clerkUserId !== "string") {
        socket.disconnect(true);
        return;
      }

      const profile = await getUserFromClerk(clerkUserId);
      const localUserId = Number(profile.user.id);

      if (!Number.isFinite(localUserId) || localUserId <= 0) {
        socket.disconnect(true);
        return;
      }

      (socket.data as { userId: number }) = { userId: localUserId };

      // Join notification + DM rooms so REST-sent messages/notifications
      // (which emit through getIo()) can reach this socket too.
      socket.join(`notifications:user:${localUserId}`);
      socket.join(`dm:user:${localUserId}`);

      socket.on("dm:typing", (payload: unknown) => {
        const data = payload as {
          recipientUserId?: number;
          isTyping?: boolean;
        };

        const senderUserId = (socket.data as { userId?: number }).userId;
        if (!senderUserId) return;

        const recipientUserId = Number(data?.recipientUserId);
        if (!Number.isFinite(recipientUserId) || recipientUserId <= 0) {
          return;
        }

        io?.to(`dm:user:${recipientUserId}`).emit("dm:typing", {
          senderUserId,
          isTyping: !!data?.isTyping,
        });
      });
    } catch (err) {
      socket.disconnect(true);
    }
  });
}

export function getIo() {
  return io;
}
