import { DbType } from "../../types";
import { users, transactions } from "@db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

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

const MERCHANT_KEY = process.env.CASINO_MERCHANT_KEY || "your-secret-key";

export const CasinoCallbackService = {
  verifySignature(headers: CallbackHeaders, body: CallbackBody): boolean {
    const {
      "x-merchant-id": merchantId,
      "x-timestamp": timestamp,
      "x-nonce": nonce,
      "x-sign": receivedSign,
    } = headers;

    const merged = {
      ...body,
      "x-merchant-id": merchantId,
      "x-timestamp": timestamp,
      "x-nonce": nonce,
    };
    const sortedKeys = Object.keys(merged).sort();
    const sortedObj: Record<string, string> = {};
    sortedKeys.forEach(
      (k) => (sortedObj[k] = String(merged[k as keyof typeof merged]))
    );

    const queryString = new URLSearchParams(sortedObj).toString();
    const calculatedSign = crypto
      .createHmac("sha1", MERCHANT_KEY)
      .update(queryString)
      .digest("hex");

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
