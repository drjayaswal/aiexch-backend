import { createClient } from "redis";

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  
});
console.log("🔗 Redis URL:", process.env.REDIS_URL || "redis://localhost:6379");

client.on("error", (err) => console.error("Redis Client Error"));
client.on("connect", () => console.log("✅ Redis connected"));

export const redis = client;

export async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}
