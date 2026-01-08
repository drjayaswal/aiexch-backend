import { DbType } from "../../types";
import { users, transactions } from "@db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import "dotenv/config";

export type CallbackHeaders = {
  "x-merchant-id": string;
  "x-timestamp": string;
  "x-nonce": string;
  "x-sign": string;
};

type CallbackBody = {
  action: "balance" | "bet" | "win" | "refund" | "rollback";
  player_id: string;
  currency: string;
  session_id?: string;
  amount?: string;
  transaction_id?: string;
  game_uuid?: string;
  round_id?: string;
  rollback_transactions?: string[];
};

const MERCHANT_KEY = process.env.CASINO_MERCHANT_KEY;
if (!MERCHANT_KEY) {
  console.log("CASINO_MERCHANT_KEY is not set");
  throw new Error("CASINO_MERCHANT_KEY is not set");
}

// PHP's http_build_query equivalent
// PHP uses rawurlencode() which is similar to encodeURIComponent but with some differences
// For most alphanumeric characters, they're the same
function phpHttpBuildQuery(params: Record<string, string | string[]>): string {
  const sortedKeys = Object.keys(params).sort();
  const parts: string[] = [];

  sortedKeys.forEach((key) => {
    const value = params[key];
    // PHP's rawurlencode() - for our use case, encodeURIComponent should be equivalent
    // but we replace %20 with + to match PHP_QUERY_RFC1738 behavior for spaces
    const encodedKey = encodeURIComponent(key).replace(/%20/g, "+");

    if (Array.isArray(value)) {
      // PHP format: key[0]=value1&key[1]=value2 (brackets are NOT encoded by PHP)
      value.forEach((item, index) => {
        const encodedValue = encodeURIComponent(String(item)).replace(
          /%20/g,
          "+"
        );
        // Note: PHP doesn't encode the brackets [ and ] in array indices
        parts.push(`${encodedKey}[${index}]=${encodedValue}`);
      });
    } else {
      const encodedValue = encodeURIComponent(String(value)).replace(
        /%20/g,
        "+"
      );
      parts.push(`${encodedKey}=${encodedValue}`);
    }
  });

  return parts.join("&");
}

export const CasinoCallbackService = {
  verifySignature(headers: CallbackHeaders, body: CallbackBody): boolean {
    const {
      "x-merchant-id": merchantId,
      "x-timestamp": timestamp,
      "x-nonce": nonce,
      "x-sign": receivedSign,
    } = headers;

    console.log("-------- checkpoint 4.1 ------------------------");
    console.log("Body received:", JSON.stringify(body, null, 2));
    console.log(
      "Headers:",
      JSON.stringify({ merchantId, timestamp, nonce, receivedSign }, null, 2)
    );

    // Filter out undefined/null values from body (matching PHP $_POST behavior)
    const filteredBody: Record<string, string | string[]> = {};
    Object.keys(body).forEach((key) => {
      const value = body[key as keyof CallbackBody];
      // Only include defined, non-null values
      if (value !== undefined && value !== null) {
        filteredBody[key] = value;
      }
    });

    // Merge with headers (matching PHP array_merge behavior)
    // IMPORTANT: PHP uses uppercase header keys (X-Merchant-Id) which affects sort order!
    // Uppercase 'X-' comes before lowercase letters in ASCII sort
    const merged: Record<string, string | string[]> = {
      ...filteredBody,
      "X-Merchant-Id": merchantId,
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
    };

    // Build query string using PHP-compatible function
    const queryString = phpHttpBuildQuery(merged);
    console.log("-------- checkpoint 4.2 ------------------------");
    console.log("Query string for signature:", queryString);

    const calculatedSign = crypto
      .createHmac("sha1", MERCHANT_KEY)
      .update(queryString)
      .digest("hex");
    console.log("-------- checkpoint 4.3 ------------------------");
    console.log("calculatedSign :", calculatedSign);
    console.log("receivedSign :", receivedSign);
    console.log("MERCHANT_KEY length:", MERCHANT_KEY.length);
    console.log(
      "MERCHANT_KEY (first 10 chars):",
      MERCHANT_KEY.substring(0, 10)
    );
    console.log("--------------------------------");
    return calculatedSign === receivedSign;
  },

  async getBalance(db: DbType, playerId: number): Promise<string | null> {
    const [user] = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, playerId))
      .limit(1);
    return user?.balance || null;
  },

  async deductBalance(
    db: DbType,
    playerId: number,
    amount: string
  ): Promise<boolean> {
    const [user] = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, playerId))
      .limit(1);

    if (!user) return false;

    const newBalance = (Number(user.balance) - Number(amount)).toString();
    await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, playerId));
    return true;
  },

  async addBalance(
    db: DbType,
    playerId: number,
    amount: string
  ): Promise<boolean> {
    const [user] = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, playerId))
      .limit(1);

    if (!user) return false;

    const newBalance = (Number(user.balance) + Number(amount)).toString();
    await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, playerId));
    return true;
  },

  async saveTransaction(
    db: DbType,
    playerId: number,
    txnId: string,
    type: string,
    amount: string,
    status: string
  ) {
    await db.insert(transactions).values({
      userId: playerId,
      type,
      amount,
      status,
      reference: txnId,
      currency: "INR",
    });
  },

  async getTransaction(db: DbType, txnId: string) {
    const [txn] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.reference, txnId))
      .limit(1);
    return txn;
  },
};
