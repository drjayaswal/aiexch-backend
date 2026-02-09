import { db } from "./index";
import { sports, competitions } from "./schema";
import { eq } from "drizzle-orm";
import cron from "node-cron";
import { SportsService } from "@services/sports";
import { getAvailableSportsList } from "@services/sports-service";

// DB Operations (same as before)
const upsertSport = async (sportData: any) => {
  try {
    // ये देखो कि API से कौनसे fields आ रहे हैं
    // console.log("Processing sport data:", sportData);

    // सही field names use करो
    const sportId = sportData.id || sportData.eventTypeId || sportData.sport_id;
    const sportName = sportData.name || sportData.eventTypeName;

    if (!sportId || !sportName) {
      console.log("❌ Skipping sport - missing ID or name:", sportData);
      return;
    }

    const existing = await db
      .select()
      .from(sports)
      .where(eq(sports.sport_id, sportId))
      .limit(1);

    if (existing.length > 0) {
      return await db
        .update(sports)
        .set({
          name: sportName,
          updated_at: new Date(),
        })
        .where(eq(sports.sport_id, sportId));
    }

    return await db.insert(sports).values({
      sport_id: sportId,
      name: sportName,
      is_active: true,
      sort_order: sportData.sortOrder || 0,
    });
  } catch (error) {
    console.error("Error upserting sport:", error);
  }
};

const upsertCompetition = async (compData: any, sportId: string) => {
  try {
    // // DEBUG: देखो क्या structure है
    // console.log(
    //   "Processing competition data:",
    //   JSON.stringify(compData, null, 2),
    // );

    // Nested structure से data निकालो
    const competition = compData.competition || compData;
    const compId = competition.id || compData.competitionId;
    const compName =
      competition.name || compData.name || compData.competitionName;
    const provider = competition.provider || compData.provider || "BETFAIR";

    console.log(
      `Extracted: id=${compId}, name=${compName}, provider=${provider}`,
    );

    if (!compId || !compName) {
      console.log("❌ Skipping competition - missing ID or name:", compData);
      return;
    }

    const existing = await db
      .select()
      .from(competitions)
      .where(eq(competitions.competition_id, compId))
      .limit(1);

    const data = {
      competition_id: compId,
      sport_id: sportId, // ये function parameter से आ रहा है
      name: compName,
      provider: provider,
      is_active: false, // API से isActive use करो
      is_archived: compData.isArchived || false,
      metadata: compData.metadata || {},
    };

    if (existing.length > 0) {
      return await db
        .update(competitions)
        .set({
          ...data,
          updated_at: new Date(),
        })
        .where(eq(competitions.competition_id, compId));
    }

    return await db.insert(competitions).values(data);
  } catch (error) {
    console.error("Error upserting competition:", error);
  }
};

// Sync Functions (UNCOMMENT THE FOR LOOPS!)
const syncSports = async () => {
  console.log("🔄 Syncing sports...");
  const sportsData = await getAvailableSportsList();
//   console.log("sports", sportsData);

  // IMPORTANT: UNCOMMENT THIS TO SAVE TO DB
  for (const sport of sportsData) {
    await upsertSport(sport);
  }

  console.log(`✅ Synced ${sportsData.length} sports`);
  return sportsData;
};

const syncCompetitions = async () => {
  console.log("🔄 Syncing competitions...");

  // Get all active sports from DB
  const dbSports = await db
    .select()
    .from(sports)
    .where(eq(sports.is_active, true));
    console.log("dbSports",dbSports)

  let totalCompetitions = 0;

  for (const sport of dbSports) {
    const competitionsData = await SportsService.getSeriesList({
      eventTypeId: sport.sport_id,
    });

    // IMPORTANT: UNCOMMENT THIS TO SAVE TO DB
    for (const comp of competitionsData) {
      await upsertCompetition(comp, sport.sport_id);
    }

    totalCompetitions += competitionsData.length;
    console.log(`✅ ${sport.name}: ${competitionsData.length} competitions`);
  }

  console.log(`✅ Total: ${totalCompetitions} competitions synced`);
  return totalCompetitions;
};

// Cron Jobs
export const startCronJobs = () => {
  // Sports: हर 24 घंटे में (midnight UTC)
  cron.schedule("0 0 * * *", syncSports, {
    timezone: "UTC",
  });

  // Competitions: हर 12 घंटे में
  cron.schedule("0 */12 * * *", syncCompetitions, {
    timezone: "UTC",
  });

  console.log("⏰ Cron jobs started:");
  console.log("   • Sports sync: Daily at 00:00 UTC");
  console.log("   • Competitions sync: Every 12 hours");

  // Optional: Server start होते ही एक बार चला दो
  console.log("🚀 Running initial sync...");
  setTimeout(async () => {
    await syncSports();
    await syncCompetitions();
  }, 10000); // 10 seconds after server starts
};

// Manual run functions
export const runAll = async () => {
  console.log("🚀 Starting manual sync...");
  await syncSports();
  await syncCompetitions();
  console.log("🎯 Manual sync completed");
};

export { syncSports, syncCompetitions };
