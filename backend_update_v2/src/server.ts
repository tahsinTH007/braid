import "dotenv/config";

import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { assertDataBaseConnection } from "./db/db.js";
import { logger } from "./lib/logger.js";
import { initIo } from "./realtime/io.js";

async function bootStrap() {
  try {
    await assertDataBaseConnection();

    const app = createApp();

    const server = http.createServer(app);

    const port = Number(env.PORT) || 5000;

    initIo(server);

    server.listen(port, () => {
      logger.info(`Server is listening to port: http://localhost:${port}`);
    });
  } catch (error) {
    logger.error("Failed to Start the Server", error);
    process.exit(1);
  }
}

bootStrap();
