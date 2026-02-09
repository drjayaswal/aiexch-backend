import axios from "axios";
import { BookmakerItem, FancyMarket, Odds } from "../types/sports/live-data";
import {
  BookmakerMarket,
  CompetitionItem,
  MarketItem,
  MatchItem,
  Score,
  ScoreMatches,
  Sports,
} from "../types/sports/lists";
import { MatchResult } from "../types/sports/results";
import { CacheService } from "./cache";
import dummysports from "../dummy/sportsevents.json";
import seriesData from "../dummy/series.json";
import matchesData from "../dummy/matches.json";
import marketData from "../dummy/getMarkets.json";
import IndividualMarketData from "../dummy/getMarketByMarketId.json";
import odds from "../dummy/odds.json";
import { getIO } from "./socket-service";

type OddsObject = {
  [key: string]: any;
};

const api = axios.create({
  baseURL: process.env.SPORTS_GAME_PROVIDER_BASE_URL || "http://100.30.62.142",
  timeout: 10000,
});

function validateArray<T>(data: unknown, defaultValue: T[] = []): T[] {
  return Array.isArray(data) ? data : defaultValue;
}

export const SportsService = {
  async getSports() {
    try {
      const response = dummysports as Sports[];
      const data = validateArray<Sports>(response);
      return data;
    } catch (error: any) {
      console.error("getSports error:");
      return [];
    }
  },

  async getSeriesWithMatches(eventTypeId: string): Promise<any[]> {
    // Cache key for this method
    const cacheKey = `sports:seriesWithMatches:${eventTypeId}`;

    try {
      console.log(
        `[SeriesCron] Fetching series with matches for eventTypeId: ${eventTypeId}`,
      );

      // Try to get from cache first (shorter TTL for this layer)
      const cachedSeries = await CacheService.get<any[]>(cacheKey);
      if (cachedSeries && cachedSeries.length > 0) {
        console.log(`[SeriesCron] Cache HIT for ${cacheKey}`);
        return cachedSeries;
      }

      console.log(`[SeriesCron] Cache MISS for ${cacheKey}`);

      const seriesList = await SportsService.getSeriesList({
        eventTypeId: eventTypeId,
      });

      if (seriesList.length === 0) {
        console.log(
          `[SeriesCron] No series found for eventTypeId: ${eventTypeId}`,
        );
        // Cache empty result too (shorter TTL for empty results)
        await CacheService.set(cacheKey, [], 5 * 60 * 60); // 5 hours for empty
        return [];
      }

      // Process each series to get matches
      const seriesPromises = seriesList.map(async (series: any) => {
        try {
          // Cache key for individual series matches
          const seriesCacheKey = `sports:seriesMatches:${eventTypeId}:${series.competition.id}`;

          // Try cache for individual series
          const cachedMatches = await CacheService.get<any[]>(seriesCacheKey);
          if (cachedMatches && cachedMatches.length > 0) {
            console.log(
              `[SeriesCron] Cache HIT for series ${series.competition.id}`,
            );
            return {
              id: series.competition.id,
              name: series.competition.name,
              eventTypeId: eventTypeId,
              matches: cachedMatches,
            };
          }

          const matchData = await SportsService.getMatchList({
            eventTypeId: eventTypeId,
            competitionId: series.competition.id,
          });

          let matches = [];
          if (matchData && Array.isArray(matchData)) {
            matches = matchData;
          }

          // Filter and format valid matches
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

          // Cache individual series matches for 60 seconds
          if (validMatches.length > 0) {
            await CacheService.set(seriesCacheKey, validMatches, 60);
          }

          // Only return series that have matches
          if (validMatches.length > 0) {
            return {
              id: series.competition.id,
              name: series.competition.name,
              eventTypeId: eventTypeId,
              matches: validMatches,
            };
          }

          return null; // Return null for series without matches
        } catch (error) {
          console.error(
            `[SeriesCron] Error getting matches for series ${series.competition?.id}:`,
            error,
          );
          return null; // Return null for failed series
        }
      });

      // Wait for all promises and filter out null values
      const allSeries = await Promise.all(seriesPromises);
      const seriesWithMatches = allSeries.filter(Boolean);

      console.log(
        `[SeriesCron] Found ${seriesWithMatches.length}/${seriesList.length} series with matches for ${eventTypeId}`,
      );

      // Cache the final result for 45 seconds
      if (seriesWithMatches.length > 0) {
        await CacheService.set(cacheKey, seriesWithMatches, 45);
      } else {
        // Cache empty result for 30 seconds
        await CacheService.set(cacheKey, [], 30);
      }

      return seriesWithMatches;
    } catch (error) {
      console.error(
        `[SeriesCron] ❌ Failed to fetch series with matches for ${eventTypeId}:`,
        error,
      );
      // Return empty array on error, don't cache errors
      return [];
    }
  },
  async getOdds({
    marketId,
  }: {
    marketId: string | string[];
  }) {
    const marketIdArray = Array.isArray(marketId) ? marketId : [marketId];
    console.log("marketId",marketIdArray)

    const chunks: string[][] = [];
    for (let i = 0; i < marketIdArray.length; i += 30) {
      chunks.push(marketIdArray.slice(i, i + 30));
    }

    try {
      const results = await Promise.all(
        chunks.map(async (chunk) => {
          // If API supports multiple IDs as comma-separated
          const marketIds = chunk.join(",");

          const response = await axios.get(
            `${process.env.SPORTS_GAME_PROVIDER_BASE_URL}/sports/books/${marketIds}`,
          );

         console.log("oddd",JSON.stringify(response.data, null, 2));

          return response.data;
        }),
      );

      // console.log("resuu",results)

      // Merge all chunk responses into one object
      const odds = Object.assign({}, ...results);

      return odds;
    } catch (error) {
      console.error("getOdds error:", error);
      return [];
    }
  },

  async getBookmarkOdds({
    eventTypeId,
    marketId,
  }: {
    eventTypeId: string;
    marketId: string | string[];
  }) {
    const marketIdArray = Array.isArray(marketId) ? marketId : [marketId];
    const chunks = [];
    for (let i = 0; i < marketIdArray.length; i += 30) {
      chunks.push(marketIdArray.slice(i, i + 30));
    }

    try {
      const results = await Promise.all(
        chunks.map(async (chunk) => {
          const marketIds = chunk.join(",");
          const response = await api.get(
            `/getBookmakerOdds?EventTypeID=${eventTypeId}&marketId=${marketIds}`,
          );
          const rawData = validateArray(response.data);
          return rawData.map((item) => {
            if (typeof item === "string") {
              try {
                return JSON.parse(item);
              } catch {
                return item;
              }
            }
            return item;
          });
        }),
      );
      return results.flat();
    } catch (error) {
      console.error("getBookmarkOdds error:");
      return [];
    }
  },

  async getBookmakers({
    eventTypeId,
    marketId,
  }: {
    eventTypeId: string;
    marketId: string | string[];
  }) {
    const marketIds = Array.isArray(marketId) ? marketId.join(",") : marketId;
    try {
      const response = await api.get(
        `/getBookmakerOdds?EventTypeID=${eventTypeId}&marketId=${marketIds}`,
      );
      const data = validateArray<BookmakerItem>(response.data);
      return data;
    } catch (error) {
      console.error("getBookmakers error:");
      return [];
    }
  },

  async getSessions({
    eventTypeId,
    matchId,
    gtype,
  }: {
    eventTypeId: string;
    matchId: string;
    gtype?: string;
  }) {
    try {
      const url = `/getSessions?EventTypeID=${eventTypeId}&matchId=${matchId}${
        gtype ? `&gtype=${gtype}` : ""
      }`;

      const response = await api.get(url);
      const rawData = validateArray(response.data);

      // Parse string data and filter sessions
      const parsedData = rawData
        .map((item) => {
          if (typeof item === "string") {
            try {
              return JSON.parse(item);
            } catch {
              return null;
            }
          }
          return item;
        })
        .filter(Boolean)
        .filter((session: any) => session.gtype === "session")
        .sort((a: any, b: any) => {
          const aSrNo = a.sr_no || 0;
          const bSrNo = b.sr_no || 0;

          if (aSrNo !== bSrNo) {
            return aSrNo - bSrNo;
          }

          const aSelectionId = a.SelectionId || 0;
          const bSelectionId = b.SelectionId || 0;

          if (aSelectionId !== bSelectionId) {
            return aSelectionId - bSelectionId;
          }

          return (a.RunnerName || "").localeCompare(b.RunnerName || "");
        });

      return parsedData;
    } catch (error) {
      // console.error("getSessions error:", error);
      return [];
    }
  },

  async getPremiumFancy({
    eventTypeId,
    matchId,
  }: {
    eventTypeId: string;
    matchId: string;
  }) {
    try {
      const response = await api.get(
        `/getPremium?EventTypeID=${eventTypeId}&matchId=${matchId}`,
      );
      const data = validateArray<FancyMarket>(response.data);
      return data;
    } catch (error) {
      // console.error("getPremiumFancy error:", error);
      return [];
    }
  },

  async getScore({
    eventTypeId,
    matchId,
  }: {
    eventTypeId: string;
    matchId: string;
  }) {
    try {
      const response = await api.get(
        `/score?EventTypeID=${eventTypeId}&matchId=${matchId}`,
      );
      return response.data && typeof response.data === "object"
        ? (response.data as Score)
        : null;
    } catch (error) {
      // console.error("getScore error:", error);
      return null;
    }
  },

  async getScoreMatchesList({ eventTypeId }: { eventTypeId: string }) {
    try {
      const response = await api.get(
        `/matches/list?EventTypeID=${eventTypeId}`,
      );
      return validateArray<ScoreMatches>(response.data);
    } catch (error) {
      console.error("getScoreMatchesList error:");
      return [];
    }
  },

  async getOddsResults({
    eventTypeId,
    marketIds,
  }: {
    eventTypeId: string;
    marketIds: string[];
  }) {
    const marketIdStr = marketIds.slice(0, 30).join(","); // Max 30 markets
    try {
      const response = await api.get(
        `/oddsResults?EventTypeID=${eventTypeId}&marketId=${marketIdStr}`,
      );
      const data = validateArray<Odds>(response.data);
      return data;
    } catch (error) {
      console.error("getOddsResults error:");
      return [];
    }
  },

  async getBookmakersResults({
    eventTypeId,
    marketIds,
  }: {
    eventTypeId: string;
    marketIds: string[];
  }) {
    const marketIdStr = marketIds.slice(0, 30).join(","); // Max 30 markets
    try {
      const response = await api.get(
        `/bookmakersResults?EventTypeID=${eventTypeId}&marketId=${marketIdStr}`,
      );
      const data = validateArray<MatchResult>(response.data);
      return data;
    } catch (error) {
      console.error("getBookmakersResults error:");
      return [];
    }
  },

  async getSessionResults({
    eventTypeId,
    marketIds,
  }: {
    eventTypeId: string;
    marketIds: string[];
  }) {
    const marketIdStr = marketIds.slice(0, 30).join(","); // Max 30 markets
    try {
      const response = await api.get(
        `/sessionsResults?EventTypeID=${eventTypeId}&marketId=${marketIdStr}`,
      );
      const data = validateArray<MatchResult>(response.data);
      return data;
    } catch (error) {
      console.error("getSessionResults error:");
      return [];
    }
  },

  async getFancyResults({
    eventTypeId,
    marketIds,
  }: {
    eventTypeId: string;
    marketIds: string[];
  }) {
    const marketIdStr = marketIds.slice(0, 30).join(","); // Max 30 markets
    try {
      const response = await api.get(
        `/fancy1Results?EventTypeID=${eventTypeId}&marketId=${marketIdStr}`,
      );
      const data = validateArray<MatchResult>(response.data);
      return data;
    } catch (error) {
      console.error("getFancyResults error:");
      return [];
    }
  },

  async getSeriesList({ eventTypeId }: { eventTypeId: string }) {
    const cacheKey = `series:${eventTypeId}`;
    try {
      console.log("Fetching series list for eventType:", eventTypeId);
      const response = await axios.get(
        `${process.env.SPORTS_GAME_PROVIDER_BASE_URL}/sports/competitions/list/${eventTypeId}`,
      );
      console.log("series",response)

      // const cached = await CacheService.get<CompetitionItem[]>(cacheKey);
      // if (Array.isArray(cached) && cached.length > 0) {
      //   return cached;
      // }

      const data = validateArray<any>(response.data);

      // Only cache if data is not empty
      // if (data && data.length > 0) {
      //   console.log("Caching series data, count:", data.length);
      //   // await CacheService.set(cacheKey, data, 3 * 60 * 60); // 3 hours
      // } else {
      //   console.log("No data to cache, returning empty array");
      // }

      return data || [];
    } catch (error: any) {
      console.error("DEBUG - getSeriesList error:", error);
      return [];
    }
  },

  async getMatchList({
    eventTypeId,
    competitionId,
  }: {
    eventTypeId: string;
    competitionId: string;
  }) {
    const cacheKey = `matches:${eventTypeId}:${competitionId}`;
    try {
      // const cached = await CacheService.get<MatchItem[]>(cacheKey);
      // if (cached) return cached;
      const response = await axios.get(
        `${process.env.SPORTS_GAME_PROVIDER_BASE_URL}/sports/competitions/${competitionId}`,
      );
      console.log("match",response)

      const data = validateArray<any>(response.data.events);

      await CacheService.set(cacheKey, data, 2 * 60 * 60); // 2 hours
      return data;
    } catch (error: any) {
      console.error("getMatchList error:");
      return [];
    }
  },

  async getMarkets({
    eventId,
  }: {
    eventId: string;
  }) {
    const cacheKey = `markets:${eventId}`;

    try {
      const response = await axios.get(
        `${process.env.SPORTS_GAME_PROVIDER_BASE_URL}/sports/events/${eventId}`,
      );

      const catalogues = Array.isArray(response.data?.catalogues)
        ? response.data.catalogues
        : [];

      if (catalogues.length === 0) {
        console.log(`[getMarkets] No markets yet for event ${eventId}`);
      }

      const data = validateArray<MarketItem>(catalogues);

      await CacheService.set(cacheKey, data, 4 * 60 * 60);
      return data;
    } catch (error) {
      console.error("getMarkets error:", error);
      return [];
    }
  },

  async getBookmakersList({
    eventTypeId,
    eventId,
  }: {
    eventTypeId: string;
    eventId: string;
  }) {
    const cacheKey = `bookmakers:${eventTypeId}:${eventId}`;
    try {
      const cached = await CacheService.get<BookmakerMarket[]>(cacheKey);
      if (cached) return cached;

      const response = await api.get(
        `/getBookmakers?EventTypeID=${eventTypeId}&EventID=${eventId}`,
      );
      const data = validateArray<BookmakerMarket>(response.data);

      await CacheService.set(cacheKey, data, 4 * 60 * 60); // 4 hours
      return data;
    } catch (error) {
      console.error("getBookmakersList error:");
      return [];
    }
  },
  
 async getMarketsWithOdds({ eventId }: { eventId: string }) {
  try {
    console.log("Fetching markets for event:", eventId);
    
    // STEP 1: Get ALL markets
    const allMarkets = await this.getMarkets({ eventId });
    
    if (!allMarkets || allMarkets.length === 0) {
      console.log("No markets found for event:", eventId);
      return [];
    }
    
    // STEP 2: Filter ONLY OPEN markets (critical optimization)
    const openMarkets = allMarkets.filter(market => market.status === "OPEN");
    
    console.log(`Total markets: ${allMarkets.length}, Open markets: ${openMarkets.length}`);
    
    if (openMarkets.length === 0) {
      console.log("No OPEN markets found");
      return [];
    }
    
    // STEP 3: Get odds ONLY for OPEN markets
    const openMarketIds = openMarkets.map(m => m.marketId);
    const oddsObject = await this.getOdds({ marketId: openMarketIds });
    
    // STEP 4: SIMPLE MERGE - Add odds to each open market
    const marketsWithOdds = openMarkets.map(market => {
      const marketOdds = oddsObject[market.marketId];
      
      return {
        marketId: market.marketId,
        marketName: market.marketName,
        marketType: market.marketType,
        status: market.status,
        inPlay: market.inPlay,
        bettingType: market.bettingType,
        marketCondition: market.marketCondition,
        runners: market.runners.map(runner => {
          // Find matching odds for this runner
          const oddsRunner = marketOdds?.runners?.find(
            (or: any) => or.selectionId === runner.id
          );
          
          return {
            selectionId: runner.id,
            name: runner.name,
            status: oddsRunner?.status || null,
            back: oddsRunner?.back?.[0] || null,  // First back price
            lay: oddsRunner?.lay?.[0] || null     // First lay price
          };
        })
      };
    });

    const io=getIO()
   if (io) {
     // Emit to specific event room
     io.to(`event:${eventId}`).emit("market-update", {
       eventId,
       markets: marketsWithOdds,
       timestamp: Date.now(),
     });
     console.log(`📡 Emitted market update for event: ${eventId}`);
   } else {
     console.log("⚠️ Socket.io not initialized, skipping emit");
   }

    console.log("marketWithOdds",marketsWithOdds)
    
    // STEP 5: Sort by sortPriority if available
    return marketsWithOdds
    
  } catch (error) {
    console.error("getMarketsWithOdds error:", error);
    return [];
  }
},
  async getBookmakersWithOdds({
    eventTypeId,
    eventId,
  }: {
    eventTypeId: string;
    eventId: string;
  }) {
    try {
      const markets = await this.getBookmakersList({ eventTypeId, eventId });

      if (!markets || markets.length === 0) {
        return [];
      }

      const marketIds = markets
        .map((market) => market.marketId)
        .filter(Boolean);

      if (marketIds.length === 0) {
        return markets;
      }

      const odds = await this.getBookmarkOdds({
        eventTypeId,
        marketId: marketIds,
      });

      const marketsWithOdds = markets.map((market) => {
        const marketOdds = odds.find(
          (odd) => odd && odd.marketId === market.marketId,
        );
        return {
          ...market,
          odds: marketOdds || null,
        };
      });

      return marketsWithOdds;
    } catch (error) {
      console.error("getBookmakersWithOdds error:");
      return [];
    }
  },

  async getSeriesListWithMatches({ eventTypeId }: { eventTypeId: string }) {
    try {
      const seriesList = await this.getSeriesList({ eventTypeId });
      console.log("list", seriesList);

      const seriesWithMatches = await Promise.all(
        seriesList.map(async (series) => {
          const matches = await this.getMatchList({
            eventTypeId,
            competitionId: series.competition.id,
          });

          return {
            id: series.competition.id,
            name: series.competition.name,
            matches,
          };
        }),
      );

      const seriesWithMatchesAndOdds = await Promise.all(
        seriesWithMatches.map(async (series) => {
          const matchesWithOdds = await Promise.all(
            series.matches.map(async (match: any) => {
              const odds = await this.getMarketsWithOdds({
                eventTypeId,
                eventId: match.event.id,
              });

              return {
                ...match,
                odds,
              };
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
      console.log("Series With Matches fetch failed");
      return [];
    }
  },

  async getMatchDetails({
    eventTypeId,
    matchId,
  }: {
    eventTypeId: string;
    matchId: string;
  }) {
    try {
      const isRacingEvent = ["7", "4339"].includes(eventTypeId);

      const marketOdds = this.getMarketsWithOdds({
        eventTypeId,
        eventId: matchId,
      });

      const score = await this.getScore({
        eventTypeId,
        matchId,
      });
      console.log("score", score);

      // 🐎 Skip unnecessary APIs for Horse Racing
      const premiumFancy = !isRacingEvent
        ? this.getPremiumFancy({ eventTypeId, matchId })
        : Promise.resolve(null);

      const bookmakers = !isRacingEvent
        ? this.getBookmakersWithOdds({ eventTypeId, eventId: matchId })
        : Promise.resolve(null);

      // const sessions = !isRacingEvent
      //   ? this.getSessions({ eventTypeId, matchId })
      //   : Promise.resolve(null);
      const sessions = this.getSessions({ eventTypeId, matchId });

      const [
        marketOddsData,
        scoreData,
        premiumFancyData,
        bookmakersData,
        sessionsData,
      ] = await Promise.all([
        marketOdds,
        score,
        premiumFancy,
        bookmakers,
        sessions,
      ]);

      const data = {
        matchOdds: marketOddsData ?? null,
        score: scoreData ?? null,
        premiumFancy: premiumFancyData ?? null,
        bookmakers: bookmakersData ?? null,
        sessions: sessionsData ?? null,
        showLay: !isRacingEvent,
      };

      return data;
    } catch (error) {
      return {
        matchOdds: null,
        score: null,
        premiumFancy: null,
        bookmakers: null,
        sessions: null,
        showLay: false,
      };
    }
  },
};
