// services/series-cron-service.ts
import cron from "node-cron";
import { SportsService } from "./sports";

// Simple in-memory cache
const cache = new Map<
  string,
  {
    data: any[];
    timestamp: number;
  }
>();

export class SeriesCronService {
  constructor() {
    console.log("[SeriesCron] Initializing with simple cache...");

    // Run every 5 seconds to update cache
    cron.schedule("*/5 * * * * *", async () => {
      console.log("[SeriesCron] ⏰ Updating cache for all event types...");
      await this.updateAllCaches();
    });

    console.log("[SeriesCron] ✅ Cron job scheduled to run every 5 seconds");
  }

  private async updateAllCaches() {
    const eventTypes = ["4", "-4", "-17", "4339", "7", "1", "2"];

    // Update each event type cache
    for (const eventTypeId of eventTypes) {
      try {
        const freshData = await this.fetchFreshSeriesData(eventTypeId);

        if (freshData.length > 0) {
          // Update cache
          cache.set(eventTypeId, {
            data: freshData,
            timestamp: Date.now(),
          });

          const totalMatches = freshData.reduce(
            (sum, series) => sum + (series.matches?.length || 0),
            0,
          );

          console.log(
            `[SeriesCron] ✅ Cache updated for ${eventTypeId}: ${freshData.length} series, ${totalMatches} matches`,
          );
        }
      } catch (error) {
        console.error(
          `[SeriesCron] ❌ Failed to update cache for ${eventTypeId}:`,
          error,
        );
      }
    }
  }

  // API METHOD: Returns cached data if available, otherwise fetches fresh
  async getSeriesData(eventTypeId: string): Promise<any[]> {
    // Check cache first
    const cached = cache.get(eventTypeId);

    if (cached) {
      console.log(
        `[SeriesCron] 🚀 Cache HIT for ${eventTypeId}, returning cached data`,
      );
      return cached.data;
    }

    console.log(
      `[SeriesCron] 🔄 Cache MISS for ${eventTypeId}, fetching fresh data...`,
    );

    // If no cache, fetch fresh data
    const freshData = await this.fetchFreshSeriesData(eventTypeId);

    // Store in cache for next time
    if (freshData.length > 0) {
      cache.set(eventTypeId, {
        data: freshData,
        timestamp: Date.now(),
      });
    }

    return freshData;
  }

  async getAllSeriesData(): Promise<Record<string, any[]>> {
    const eventTypes = ["4", "-4", "-17", "4339", "7", "1", "2"];
    const result: Record<string, any[]> = {};

    for (const eventTypeId of eventTypes) {
      // This will use cache if available
      const data = await this.getSeriesData(eventTypeId);
      if (data.length > 0) {
        result[eventTypeId] = data;
      }
    }

    return result;
  }

  // Same fetch method as before
  private async fetchFreshSeriesData(eventTypeId: string): Promise<any[]> {
    try {
      const seriesList = await SportsService.getSeriesList({
        eventTypeId: eventTypeId,
      });

      if (seriesList.length === 0) {
        return [];
      }

      // Get matches for each series
      const seriesWithMatches = await Promise.all(
        seriesList.map(async (series: any) => {
          try {
            const matchData = await SportsService.getMatchList({
              eventTypeId: eventTypeId,
              competitionId: series.competition.id,
            });

            let matches = [];
            if (matchData && Array.isArray(matchData)) {
              matches = matchData;
            }

            const validMatches = matches
              .filter((match: any) => match && match.id)
              .map((match: any) => {
                if (match.id && match.name) {
                  return {
                    id: match.id,
                    name: match.name,
                    openDate: match.openDate || null,
                    status: match.status || "UNKNOWN",
                  };
                } else if (match.event && match.event.id) {
                  return {
                    id: match.event.id,
                    name: match.event.name || "Unknown Match",
                    openDate: match.event.openDate || null,
                    status: match.status || "UNKNOWN",
                  };
                }
                return null;
              })
              .filter(Boolean);

            return {
              id: series.competition.id,
              name: series.competition.name,
              eventTypeId: eventTypeId,
              matches: validMatches,
            };
          } catch (error) {
            console.error(
              `[SeriesCron] ❌ Error getting matches for series ${series.competition.id}:`,
              error,
            );
            return {
              id: series.competition.id,
              name: series.competition.name,
              eventTypeId: eventTypeId,
              matches: [],
            };
          }
        }),
      );

      // Get odds for each match
      const seriesWithMatchesAndOdds = await Promise.all(
        seriesWithMatches.map(async (series: any) => {
          if (!series.matches || series.matches.length === 0) {
            return series;
          }

          const matchesWithOdds = await Promise.all(
            series.matches.map(async (match: any) => {
              try {
                const odds = await SportsService.getMarketsWithOdds({
                  eventTypeId: eventTypeId,
                  eventId: match.id,
                });

                return {
                  ...match,
                  odds: Array.isArray(odds) ? odds : [],
                };
              } catch (error) {
                console.error(
                  `[SeriesCron] ❌ Failed to fetch odds for match ${match.id}:`,
                  error,
                );
                return {
                  ...match,
                  odds: [],
                };
              }
            }),
          );

          return {
            ...series,
            matches: matchesWithOdds,
          };
        }),
      );

      return seriesWithMatchesAndOdds;
    } catch (error) {
      console.error(
        `[SeriesCron] ❌ Failed to fetch fresh data for ${eventTypeId}:`,
        error,
      );
      return [];
    }
  }
}

// Create singleton instance
export const seriesCronService = new SeriesCronService();
