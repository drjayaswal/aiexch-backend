
import { randomInt } from "crypto";

export function generateNumericRandomId(): bigint {
  // Generate in smaller chunks
  const chunk1 = randomInt(1, 1000000); // 1 to 1,000,000
  const chunk2 = randomInt(1, 1000000); // 1 to 1,000,000
  const chunk3 = randomInt(1, 10000); // 1 to 10,000

  // Combine: chunk1 + chunk2*1,000,000 + chunk3*1,000,000,000
  return (
    BigInt(chunk1) +
    BigInt(chunk2) * 1_000_000n +
    BigInt(chunk3) * 1_000_000_000_000n
  );
}

export function generateNumericId() {
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  let random = "";
  const chars = "0123456789";
  for (let i = 0; i < 3; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return timestamp + random;
}
