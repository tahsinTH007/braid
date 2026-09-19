import "dotenv/config";
import { logger } from "../lib/logger.js";
import { pool, query } from "./db.js";

const SEED_USERS = [
  {
    clerkUserId: "seed_user_ava",
    displayName: "Ava Thompson",
    handle: "ava",
    bio: "Frontend dev. Coffee-powered.",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Ava",
  },
  {
    clerkUserId: "seed_user_liam",
    displayName: "Liam Carter",
    handle: "liamc",
    bio: "Backend engineer, Postgres enjoyer.",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Liam",
  },
  {
    clerkUserId: "seed_user_maya",
    displayName: "Maya Singh",
    handle: "mayasingh",
    bio: "Building things on the side.",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Maya",
  },
  {
    clerkUserId: "seed_user_noah",
    displayName: "Noah Kim",
    handle: "noahk",
    bio: "DevOps / infra.",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Noah",
  },
  {
    clerkUserId: "seed_user_zara",
    displayName: "Zara Ali",
    handle: "zaraali",
    bio: "Designer who codes.",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Zara",
  },
];

const SEED_THREADS = [
  {
    categorySlug: "general",
    author: "seed_user_ava",
    title: "What's everyone building this month?",
    body: "Curious what side projects people are working on right now. I'm rebuilding my portfolio with Next.js and it's going better than expected!",
    replies: [
      { author: "seed_user_liam", body: "Rewriting an old Express API in tRPC, learning a lot." },
      { author: "seed_user_maya", body: "A small habit tracker app for myself." },
    ],
    likedBy: ["seed_user_liam", "seed_user_maya", "seed_user_noah"],
  },
  {
    categorySlug: "q-and-a",
    author: "seed_user_liam",
    title: "Best way to structure a Node + Postgres backend in 2026?",
    body: "Looking for opinions on folder structure for a medium-sized REST API. Repository pattern vs raw queries vs an ORM like Drizzle?",
    replies: [
      { author: "seed_user_noah", body: "Repository pattern with raw SQL has served me well, keeps things explicit." },
    ],
    likedBy: ["seed_user_ava"],
  },
  {
    categorySlug: "showcase",
    author: "seed_user_zara",
    title: "Shipped a redesign of my personal site",
    body: "Finally got around to redesigning my portfolio with a cleaner grid layout and dark mode. Would love feedback!",
    replies: [
      { author: "seed_user_ava", body: "Love the color palette, very clean." },
      { author: "seed_user_noah", body: "Nice! How did you handle the dark mode toggle?" },
    ],
    likedBy: ["seed_user_ava", "seed_user_liam", "seed_user_noah", "seed_user_maya"],
  },
  {
    categorySlug: "help",
    author: "seed_user_noah",
    title: "Socket.io keeps disconnecting behind our load balancer",
    body: "Getting frequent disconnects in production when running multiple instances behind an ALB. Anyone dealt with sticky sessions for websockets before?",
    replies: [
      { author: "seed_user_liam", body: "Make sure sticky sessions are enabled on the load balancer, that fixed it for us." },
    ],
    likedBy: ["seed_user_liam"],
  },
  {
    categorySlug: "general",
    author: "seed_user_maya",
    title: "Mechanical keyboards worth the hype?",
    body: "Thinking about getting one for the home office. Any recommendations for something quiet enough for video calls?",
    replies: [],
    likedBy: ["seed_user_zara"],
  },
];

const SEED_DMS: Array<{ from: string; to: string; body: string }> = [
  { from: "seed_user_ava", to: "seed_user_liam", body: "Hey! Did you see the new thread about backend structure?" },
  { from: "seed_user_liam", to: "seed_user_ava", body: "Yeah just replied to it, curious what you think of Drizzle." },
  { from: "seed_user_ava", to: "seed_user_liam", body: "Haven't tried it yet, might give it a spin this weekend." },
  { from: "seed_user_maya", to: "seed_user_zara", body: "Your portfolio redesign looks awesome!" },
  { from: "seed_user_zara", to: "seed_user_maya", body: "Thank you! Took a couple weekends to get right." },
];

async function seed() {
  logger.info("Seeding mock data...");

  const marker = await query(
    `SELECT id FROM users WHERE clerk_user_id = $1 LIMIT 1`,
    [SEED_USERS[0].clerkUserId],
  );

  if ((marker.rowCount ?? 0) > 0) {
    logger.info("Seed data already present, skipping. (delete seed_user_* rows to re-seed)");
    return;
  }

  const userIdBySeedId = new Map<string, number>();

  for (const user of SEED_USERS) {
    const res = await query<{ id: number }>(
      `
      INSERT INTO users (clerk_user_id, display_name, handle, bio, avatar_url)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (clerk_user_id) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id
      `,
      [user.clerkUserId, user.displayName, user.handle, user.bio, user.avatarUrl],
    );

    userIdBySeedId.set(user.clerkUserId, res.rows[0].id);
  }

  logger.info(`Inserted ${SEED_USERS.length} mock users`);

  const categoryRes = await query<{ id: number; slug: string }>(
    `SELECT id, slug FROM categories`,
  );
  const categoryIdBySlug = new Map(categoryRes.rows.map((row) => [row.slug, row.id]));

  let threadCount = 0;
  let replyCount = 0;
  let likeCount = 0;

  for (const thread of SEED_THREADS) {
    const categoryId = categoryIdBySlug.get(thread.categorySlug);
    const authorUserId = userIdBySeedId.get(thread.author);

    if (!categoryId || !authorUserId) continue;

    const threadRes = await query<{ id: number }>(
      `
      INSERT INTO threads (category_id, author_user_id, title, body)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [categoryId, authorUserId, thread.title, thread.body],
    );

    const threadId = threadRes.rows[0].id;
    threadCount++;

    for (const reply of thread.replies) {
      const replyAuthorId = userIdBySeedId.get(reply.author);
      if (!replyAuthorId) continue;

      await query(
        `
        INSERT INTO replies (thread_id, author_user_id, body)
        VALUES ($1, $2, $3)
        `,
        [threadId, replyAuthorId, reply.body],
      );
      replyCount++;
    }

    for (const likerSeedId of thread.likedBy) {
      const likerUserId = userIdBySeedId.get(likerSeedId);
      if (!likerUserId) continue;

      await query(
        `
        INSERT INTO thread_reactions (thread_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (thread_id, user_id) DO NOTHING
        `,
        [threadId, likerUserId],
      );
      likeCount++;
    }
  }

  logger.info(`Inserted ${threadCount} threads, ${replyCount} replies, ${likeCount} likes`);

  let dmCount = 0;
  for (const dm of SEED_DMS) {
    const fromId = userIdBySeedId.get(dm.from);
    const toId = userIdBySeedId.get(dm.to);
    if (!fromId || !toId) continue;

    await query(
      `
      INSERT INTO direct_messages (sender_user_id, recipient_user_id, body)
      VALUES ($1, $2, $3)
      `,
      [fromId, toId, dm.body],
    );
    dmCount++;
  }

  logger.info(`Inserted ${dmCount} direct messages`);
  logger.info("Seed complete.");
}

seed()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(`Seeding failed: ${(err as Error).message}`);
    return pool.end().finally(() => process.exit(1));
  });
