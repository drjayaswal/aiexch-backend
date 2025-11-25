import { Elysia, t } from "elysia";
import { whitelabel_middleware } from "@middleware/whitelabel";
import { transactions } from "@db/schema";
import { eq } from "drizzle-orm";
import { CasinoCallbackService } from "@services/casino/casino-callback";
import type { CallbackHeaders } from "@services/casino/casino-callback";
import { DbType } from "../../types";

export const casinoCallbackRoutes = new Elysia({ prefix: "/casino/callback" })
  .resolve(async ({ request }): Promise<{ db: DbType; whitelabel: any }> => {
    const { db, whitelabel } = await whitelabel_middleware(request);
    return { db: db as DbType, whitelabel };
  })
  .post(
    "/",
    async ({ body, headers, db, set }) => {
      const startTime = Date.now();
      set.status = 200;

      try {
        const {
          action,
          player_id,
          currency,
          amount,
          transaction_id,
          rollback_transactions,
        } = body;

        console.log(`[Casino Callback] 📥 Request received:`, {
          action,
          player_id,
          currency,
          amount,
          transaction_id,
          timestamp: new Date().toISOString(),
        });

        const requiredHeaderKeys: Array<keyof CallbackHeaders> = [
          "x-merchant-id",
          "x-timestamp",
          "x-nonce",
          "x-sign",
        ];

        const missingHeader = requiredHeaderKeys.find((key) => !headers[key]);

        if (missingHeader) {
          console.warn(
            `[Casino Callback] ❌ Missing signature header: ${missingHeader}`,
            {
              action,
              player_id,
              receivedHeaders: Object.keys(headers),
            }
          );
          return {
            success: false,
            error: `Missing signature header: ${missingHeader}`,
          };
        }

        const signatureHeaders: CallbackHeaders = {
          "x-merchant-id": headers["x-merchant-id"] as string,
          "x-timestamp": headers["x-timestamp"] as string,
          "x-nonce": headers["x-nonce"] as string,
          "x-sign": headers["x-sign"] as string,
        };

        const signatureValid = CasinoCallbackService.verifySignature(
          signatureHeaders,
          body
        );
        if (!signatureValid) {
          console.error(`[Casino Callback] ❌ Invalid signature`, {
            action,
            player_id,
            merchantId: signatureHeaders["x-merchant-id"],
            timestamp: signatureHeaders["x-timestamp"],
          });
          return { success: false, error: "Invalid signature" };
        }

        console.log(`[Casino Callback] ✅ Signature verified`, {
          action,
          player_id,
          merchantId: signatureHeaders["x-merchant-id"],
        });

        if (currency !== "INR") {
          console.warn(`[Casino Callback] ❌ Invalid currency: ${currency}`, {
            action,
            player_id,
            expectedCurrency: "INR",
          });
          set.status = 400;
          return { success: false, error: "Invalid currency" };
        }

        const playerId = Number(player_id);
        if (isNaN(playerId)) {
          console.warn(`[Casino Callback] ❌ Invalid player_id: ${player_id}`, {
            action,
          });
          set.status = 400;
          return { success: false, error: "Invalid player_id" };
        }

        switch (action) {
          case "balance": {
            console.log(`[Casino Callback] 💰 Balance check requested`, {
              playerId,
            });
            const balance = await CasinoCallbackService.getBalance(
              db,
              playerId
            );
            if (balance === null) {
              console.warn(
                `[Casino Callback] ❌ Player not found for balance check`,
                {
                  playerId,
                }
              );
              set.status = 404;
              return { success: false, error: "Player not found" };
            }
            console.log(`[Casino Callback] ✅ Balance retrieved`, {
              playerId,
              balance,
              duration: `${Date.now() - startTime}ms`,
            });
            set.status = 200;
            return { success: true, balance };
          }

          case "bet": {
            console.log(`[Casino Callback] 🎲 Bet request received`, {
              playerId,
              transaction_id,
              amount,
            });

            if (!transaction_id || !amount) {
              console.warn(
                `[Casino Callback] ❌ Missing transaction_id or amount`,
                {
                  playerId,
                  hasTransactionId: !!transaction_id,
                  hasAmount: !!amount,
                }
              );
              set.status = 400;
              return {
                success: false,
                error: "Missing transaction_id or amount",
              };
            }

            const existingTxn = await CasinoCallbackService.getTransaction(
              db,
              transaction_id
            );
            if (existingTxn) {
              console.log(
                `[Casino Callback] ✅ Bet transaction already exists (idempotent)`,
                {
                  playerId,
                  transaction_id,
                  existingStatus: existingTxn.status,
                }
              );
              const balance = await CasinoCallbackService.getBalance(
                db,
                playerId
              );
              return { success: true, balance, transaction_id };
            }

            const balance = await CasinoCallbackService.getBalance(
              db,
              playerId
            );
            if (balance === null) {
              console.warn(`[Casino Callback] ❌ Player not found for bet`, {
                playerId,
                transaction_id,
              });
              set.status = 404;
              return { success: false, error: "Player not found" };
            }

            const currentBalance = Number(balance);
            const betAmount = Number(amount);

            if (currentBalance < betAmount) {
              console.warn(
                `[Casino Callback] ❌ Insufficient balance for bet`,
                {
                  playerId,
                  transaction_id,
                  currentBalance,
                  betAmount,
                  shortfall: betAmount - currentBalance,
                }
              );
              set.status = 400;
              return { success: false, error: "Insufficient balance" };
            }

            console.log(`[Casino Callback] 💸 Processing bet`, {
              playerId,
              transaction_id,
              currentBalance,
              betAmount,
              newBalance: currentBalance - betAmount,
            });

            await CasinoCallbackService.deductBalance(db, playerId, amount);
            await CasinoCallbackService.saveTransaction(
              db,
              playerId,
              transaction_id,
              "bet",
              amount,
              "completed"
            );

            const newBalance = await CasinoCallbackService.getBalance(
              db,
              playerId
            );

            console.log(`[Casino Callback] ✅ Bet processed successfully`, {
              playerId,
              transaction_id,
              betAmount,
              previousBalance: currentBalance,
              newBalance,
              duration: `${Date.now() - startTime}ms`,
            });

            return { success: true, balance: newBalance, transaction_id };
          }

          case "win": {
            console.log(`[Casino Callback] 🎉 Win request received`, {
              playerId,
              transaction_id,
              amount,
            });

            if (!transaction_id || !amount) {
              console.warn(
                `[Casino Callback] ❌ Missing transaction_id or amount for win`,
                {
                  playerId,
                  hasTransactionId: !!transaction_id,
                  hasAmount: !!amount,
                }
              );
              set.status = 400;
              return {
                success: false,
                error: "Missing transaction_id or amount",
              };
            }

            const existingTxn = await CasinoCallbackService.getTransaction(
              db,
              transaction_id
            );
            if (existingTxn) {
              console.log(
                `[Casino Callback] ✅ Win transaction already exists (idempotent)`,
                {
                  playerId,
                  transaction_id,
                  existingStatus: existingTxn.status,
                }
              );
              const balance = await CasinoCallbackService.getBalance(
                db,
                playerId
              );
              return { success: true, balance, transaction_id };
            }

            const balanceBefore = await CasinoCallbackService.getBalance(
              db,
              playerId
            );
            if (balanceBefore === null) {
              console.warn(`[Casino Callback] ❌ Player not found for win`, {
                playerId,
                transaction_id,
              });
              set.status = 404;
              return { success: false, error: "Player not found" };
            }

            const winAmount = Number(amount);
            const currentBalance = Number(balanceBefore);

            console.log(`[Casino Callback] 💰 Processing win`, {
              playerId,
              transaction_id,
              winAmount,
              currentBalance,
              newBalance: currentBalance + winAmount,
            });

            await CasinoCallbackService.addBalance(db, playerId, amount);
            await CasinoCallbackService.saveTransaction(
              db,
              playerId,
              transaction_id,
              "win",
              amount,
              "completed"
            );

            const newBalance = await CasinoCallbackService.getBalance(
              db,
              playerId
            );

            console.log(`[Casino Callback] ✅ Win processed successfully`, {
              playerId,
              transaction_id,
              winAmount,
              previousBalance: currentBalance,
              newBalance,
              duration: `${Date.now() - startTime}ms`,
            });

            return { success: true, balance: newBalance, transaction_id };
          }

          case "refund": {
            console.log(`[Casino Callback] 🔄 Refund request received`, {
              playerId,
              transaction_id,
              amount,
            });

            if (!transaction_id || !amount) {
              console.warn(
                `[Casino Callback] ❌ Missing transaction_id or amount for refund`,
                {
                  playerId,
                  hasTransactionId: !!transaction_id,
                  hasAmount: !!amount,
                }
              );
              set.status = 400;
              return {
                success: false,
                error: "Missing transaction_id or amount",
              };
            }

            const existingTxn = await CasinoCallbackService.getTransaction(
              db,
              transaction_id
            );
            if (existingTxn) {
              console.log(
                `[Casino Callback] ✅ Refund transaction already exists (idempotent)`,
                {
                  playerId,
                  transaction_id,
                  existingStatus: existingTxn.status,
                }
              );
              const balance = await CasinoCallbackService.getBalance(
                db,
                playerId
              );
              return { success: true, balance, transaction_id };
            }

            const balanceBefore = await CasinoCallbackService.getBalance(
              db,
              playerId
            );
            if (balanceBefore === null) {
              console.warn(`[Casino Callback] ❌ Player not found for refund`, {
                playerId,
                transaction_id,
              });
              set.status = 404;
              return { success: false, error: "Player not found" };
            }

            const refundAmount = Number(amount);
            const currentBalance = Number(balanceBefore);

            console.log(`[Casino Callback] 💰 Processing refund`, {
              playerId,
              transaction_id,
              refundAmount,
              currentBalance,
              newBalance: currentBalance + refundAmount,
            });

            await CasinoCallbackService.addBalance(db, playerId, amount);
            await CasinoCallbackService.saveTransaction(
              db,
              playerId,
              transaction_id,
              "refund",
              amount,
              "completed"
            );

            const newBalance = await CasinoCallbackService.getBalance(
              db,
              playerId
            );

            console.log(`[Casino Callback] ✅ Refund processed successfully`, {
              playerId,
              transaction_id,
              refundAmount,
              previousBalance: currentBalance,
              newBalance,
              duration: `${Date.now() - startTime}ms`,
            });

            return { success: true, balance: newBalance, transaction_id };
          }

          case "rollback": {
            console.log(`[Casino Callback] ↩️ Rollback request received`, {
              playerId,
              rollbackCount: rollback_transactions?.length || 0,
              transactionIds: rollback_transactions,
            });

            if (!rollback_transactions || rollback_transactions.length === 0) {
              console.warn(
                `[Casino Callback] ❌ Missing rollback_transactions`,
                {
                  playerId,
                }
              );
              set.status = 400;
              return { success: false, error: "Missing rollback_transactions" };
            }

            const balanceBefore = await CasinoCallbackService.getBalance(
              db,
              playerId
            );
            if (balanceBefore === null) {
              console.warn(
                `[Casino Callback] ❌ Player not found for rollback`,
                {
                  playerId,
                }
              );
              set.status = 404;
              return { success: false, error: "Player not found" };
            }

            let rolledBackCount = 0;
            let skippedCount = 0;
            let totalRefunded = 0;
            let totalDeducted = 0;

            for (const txnId of rollback_transactions) {
              const txn = await CasinoCallbackService.getTransaction(db, txnId);
              if (txn) {
                console.log(`[Casino Callback] 🔄 Rolling back transaction`, {
                  playerId,
                  transactionId: txnId,
                  transactionType: txn.type,
                  transactionAmount: txn.amount,
                  currentStatus: txn.status,
                });

                if (txn.type === "bet") {
                  const refundAmount = Number(txn.amount);
                  await CasinoCallbackService.addBalance(
                    db,
                    playerId,
                    txn.amount
                  );
                  totalRefunded += refundAmount;
                  console.log(`[Casino Callback] 💰 Refunded bet amount`, {
                    playerId,
                    transactionId: txnId,
                    refundAmount,
                  });
                } else if (txn.type === "win") {
                  const deductAmount = Number(txn.amount);
                  await CasinoCallbackService.deductBalance(
                    db,
                    playerId,
                    txn.amount
                  );
                  totalDeducted += deductAmount;
                  console.log(`[Casino Callback] 💸 Deducted win amount`, {
                    playerId,
                    transactionId: txnId,
                    deductAmount,
                  });
                }

                await db
                  .update(transactions)
                  .set({ status: "rolled_back" })
                  .where(eq(transactions.reference, txnId));

                rolledBackCount++;
              } else {
                console.warn(
                  `[Casino Callback] ⚠️ Transaction not found for rollback`,
                  {
                    playerId,
                    transactionId: txnId,
                  }
                );
                skippedCount++;
              }
            }

            const balanceAfter = await CasinoCallbackService.getBalance(
              db,
              playerId
            );

            console.log(`[Casino Callback] ✅ Rollback completed`, {
              playerId,
              totalTransactions: rollback_transactions.length,
              rolledBackCount,
              skippedCount,
              totalRefunded,
              totalDeducted,
              previousBalance: balanceBefore,
              newBalance: balanceAfter,
              duration: `${Date.now() - startTime}ms`,
            });

            return { success: true, balance: balanceAfter };
          }

          default:
            console.warn(`[Casino Callback] ❌ Invalid action`, {
              action,
              playerId,
              receivedAction: action,
              validActions: ["balance", "bet", "win", "refund", "rollback"],
            });
            set.status = 400;
            return { success: false, error: "Invalid action" };
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[Casino Callback] ❌ Unexpected error`, {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          action: (body as any)?.action,
          player_id: (body as any)?.player_id,
          duration: `${duration}ms`,
        });
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        action: t.Union([
          t.Literal("balance"),
          t.Literal("bet"),
          t.Literal("win"),
          t.Literal("refund"),
          t.Literal("rollback"),
        ]),
        player_id: t.String(),
        currency: t.String(),
        session_id: t.Optional(t.String()),
        amount: t.Optional(t.String()),
        transaction_id: t.Optional(t.String()),
        game_uuid: t.Optional(t.String()),
        round_id: t.Optional(t.String()),
        rollback_transactions: t.Optional(t.Array(t.String())),
      }),
    }
  );
