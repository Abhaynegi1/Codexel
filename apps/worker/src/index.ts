import * as dotenv from "dotenv";

dotenv.config();

console.log("Codexel Analysis Worker initialized.");
console.log("Ready to process analysis jobs via BullMQ / Redis.");

export function startWorker() {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  console.log(`Configured Redis connection: ${redisUrl}`);
  // Worker queue listener will be active when background jobs are dispatched in Phase 1
}

if (process.env.NODE_ENV !== "test") {
  startWorker();
}
