// routes/series-route.ts
import { Elysia, t } from "elysia";
import { seriesCronService } from "../services/series-cron-service";
import { redis } from "@db/redis";
import { param } from "drizzle-orm";



export const seriesRoutes = new Elysia({ prefix: "/api/sports" })
  // Get series for specific event type
  .get(
    "/series/:eventTypeId",
    async ({ params }) => {

       const { eventTypeId } = params;
       console.log("ppp",params)
       console.log("ttt",eventTypeId)

      try {
        const { eventTypeId } = params;
        const data = await seriesCronService.getSeriesData(eventTypeId);
          if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn(
              `[SeriesCron] Empty data received. Skipping cache for eventTypeId=${eventTypeId}`,
            );
            return {
              success: true,
              eventTypeId: eventTypeId,
              data: data,
              timestamp: new Date().toISOString(),
              count: data.length,
              message: `Series data for eventType ${eventTypeId} (cron updates every 5 seconds)`,
            }; // return but don't cache
          }


          // await redis.set(cacheKey, JSON.stringify(data), { EX: 5*60 });

        return {
          success: true,
          eventTypeId: eventTypeId,
          
          data: data,
          timestamp: new Date().toISOString(),
          count: data.length,
          message: `Series data for eventType ${eventTypeId} (cron updates every 5 seconds)`,
        };
      } catch (error: any) {
        return {
          success: false,
          eventTypeId: params.eventTypeId,
          message: error.message || "Failed to fetch series data",
          data: [],
        };
      }
    },
    {
      params: t.Object({
        eventTypeId: t.String(),
      }),
    },
  )

  // Get available sports list
  .get("/sports-list", () => {
    const sportsList = [
      { eventType: "4", name: "Cricket" },
      { eventType: "-4", name: "KABADDI" },
      { eventType: "-17", name: "Virtual T10" },
      { eventType: "4339", name: "Greyhound Racing" },
      { eventType: "7", name: "Horse Racing" },
      { eventType: "1", name: "Football" },
      { eventType: "2", name: "Tennis" },
    ];

    return {
      success: true,
      data: sportsList,
      count: sportsList.length,
    };
  });
