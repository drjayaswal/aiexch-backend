import { db } from "@db/index";
import { competitions, sports } from "@db/schema";
import { redis } from "@db/redis";
import { eq } from "drizzle-orm";

export const getCompetitionsBySportId = async (sportId: string) => {
  try {
    console.log("kese", sportId);
    // const cacheKey = `dashboard-competitions:${sportId}`;

    // // 1️⃣ Check Redis cache
    // const cached = await redis.get(cacheKey);

    // if (cached) {
    //   console.log("✅ Returning cached competition data", cached);
    //   return JSON.parse(cached);
    // }

    console.log("🔄 Fetching competitions from database...");

    // 2️⃣ Fetch from DB
    const competitionData = await db
      .select()
      .from(competitions)
      .where(eq(competitions.sport_id, sportId));

    console.log(
      `✅ Found ${competitionData.length} competitions for ${sportId}`,
    );

    // 3️⃣ Cache result (5 min)
    // await redis.set(cacheKey, JSON.stringify(competitionData), {
    //   EX: 300,
    // });

    return competitionData;
  } catch (error) {
    console.error("❌ Error fetching competitions:", error);
    return [];
  }
};
// Add this function to your games-service.ts file
// games-service.ts
export const updateCompetitionsStatus = async (
  sportId: string,
  updates: Array<{ id: string; isActive: boolean }>,
) => {
  try {
    console.log(
      `🔄 Updating ${updates.length} competition statuses for sport:`,
      sportId,updates
    );

    if (updates.length === 0) {
      return { success: true, message: "No updates to process" };
    }

    // Update database
    await db.transaction(async (tx) => {
      for (const update of updates) {
        const competitionId = parseInt(update.id, 10);

        await tx
          .update(competitions)
          .set({ is_active: update.isActive })
          .where(eq(competitions.competition_id, update.id)); // ✅ competition_id use karo
      }
    });

    // ✅ IMPORTANT: Sirf series list cache clear karo
    const seriesCacheKey = `series:${sportId}`;
    const competitionsCacheKey =`dashboard-competitions:${sportId}`;
    const seriesWithMatchesCacheKey = `series:withMatches:${sportId}`;
    await redis.del(seriesCacheKey);
    await redis.del(competitionsCacheKey);
    await redis.del(seriesWithMatchesCacheKey);

    console.log(`✅ Cleared cache key: ${seriesCacheKey}`);
    console.log(`✅ Cleared cache key: ${competitionsCacheKey}`);

    return {
      success: true,
      message: `Updated ${updates.length} competition(s) successfully`,
    };
  } catch (error) {
    console.error("❌ Error updating competition statuses:", error);
    return {
      success: false,
      message: "Failed to update competition statuses",
    };
  }
};