import { SportsService } from "./sports";
import { CacheService } from "./cache";

type Subscription = {
  eventTypeId: string;
  marketIds?: string[];
  matchId?: string;
  type:
    | "odds"
    | "bookmakers"
    | "sessions"
    | "score"
    | "premium"
    | "matchDetails"
    | "series";
};

type WebSocketClient = {
  id: string;
  subscriptions: Set<string>;
  send: (data: any) => void;
};

class SportsWebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private subscriptionMap: Map<string, Set<string>> = new Map();

  private getSubscriptionKey(sub: Subscription): string {
    if (sub.type === "odds" || sub.type === "bookmakers") {
      return `${sub.type}:${sub.eventTypeId}:${sub.marketIds?.sort().join(",") || ""}`;
    }
    if (
      sub.type === "sessions" ||
      sub.type === "score" ||
      sub.type === "premium"
    ) {
      return `${sub.type}:${sub.eventTypeId}:${sub.matchId}`;
    }
    if (sub.type === "matchDetails") {
      return `${sub.type}:${sub.eventTypeId}:${sub.matchId}`;
    }
    if (sub.type === "series") {
      return `${sub.type}:${sub.eventTypeId}`;
    }
    return `${sub.type}:${sub.eventTypeId}`;
  }

  addClient(clientId: string, send: (data: any) => void): void {
    console.log(`[WS Manager] ➕ Adding client: ${clientId}`);
    this.clients.set(clientId, {
      id: clientId,
      subscriptions: new Set(),
      send,
    });
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    console.log(`[WS Manager] ➖ Removing client: ${clientId}`);

    // Remove client from all subscriptions
    client.subscriptions.forEach((subKey) => {
      const subscribers = this.subscriptionMap.get(subKey);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          // No more subscribers, stop polling
          const interval = this.intervals.get(subKey);
          if (interval) {
            clearInterval(interval);
            this.intervals.delete(subKey);
            console.log(
              `[WS Manager] ⏹️ Stopped polling for ${subKey} (no more subscribers)`,
            );
          }
          this.subscriptionMap.delete(subKey);
        }
      }
    });

    this.clients.delete(clientId);
  }

  async subscribe(clientId: string, subscription: Subscription): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      console.error(
        `[WS Manager] ❌ Client ${clientId} not found for subscription`,
      );
      return;
    }

    const subKey = this.getSubscriptionKey(subscription);
    console.log(`[WS Manager] 📝 Client ${clientId} subscribing to ${subKey}`);

    client.subscriptions.add(subKey);

    // Add client to subscription map
    if (!this.subscriptionMap.has(subKey)) {
      this.subscriptionMap.set(subKey, new Set());
    }
    this.subscriptionMap.get(subKey)!.add(clientId);

    // Start polling if not already started
    if (!this.intervals.has(subKey)) {
      console.log(`[WS Manager] 🚀 Starting polling for ${subKey}`);
      // Start polling immediately
      this.startPolling(subKey, subscription).catch((error) => {
        console.error(
          `[WS Manager] ❌ Failed to start polling for ${subKey}:`,
          error,
        );
      });
    } else {
      console.log(
        `[WS Manager] 🔄 Polling already active for ${subKey}, sending immediate data`,
      );
      // If polling already exists, immediately send cached data to new subscriber
     const cachedData = await CacheService.get(`ws:last:${subKey}`);
     if (cachedData) {
       client.send(
         JSON.stringify({
           type: `${subscription.type}:update`,
           subscription,
           data: cachedData,
         }),
       );
     }

    }
  }

  unsubscribe(clientId: string, subscription: Subscription): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    const subKey = this.getSubscriptionKey(subscription);
    console.log(
      `[WS Manager] 📤 Client ${clientId} unsubscribing from ${subKey}`,
    );

    client.subscriptions.delete(subKey);

    const subscribers = this.subscriptionMap.get(subKey);
    if (subscribers) {
      subscribers.delete(clientId);

      if (subscribers.size === 0) {
        // No more subscribers, stop polling
        const interval = this.intervals.get(subKey);
        if (interval) {
          clearInterval(interval);
          this.intervals.delete(subKey);
          console.log(
            `[WS Manager] ⏹️ Stopped polling for ${subKey} (no more subscribers)`,
          );
        }
        this.subscriptionMap.delete(subKey);
      }
    }
  }

  private async startPolling(
    subKey: string,
    subscription: Subscription,
  ): Promise<void> {
    // Initial fetch - IMPORTANT: This sends the first data immediately
    console.log(`[WS Manager] 📊 Initial fetch for ${subKey}`);
    await this.fetchAndBroadcast(subKey, subscription);

    // Set polling interval based on data type
    const pollingInterval =
      subscription.type === "odds"
        ? 1000 // 1 second for odds
        : subscription.type === "series"
          ? 20000 // 2 seconds for series (reduced frequency to avoid overwhelming)
          : subscription.type === "matchDetails"
            ? 5 * 60 * 1000 // 5 minutes
            : 1000; // 1 second

    console.log(
      `[WS Manager] ⏰ Setting polling interval for ${subKey}: ${pollingInterval}ms`,
    );

    const interval = setInterval(async () => {
      await this.fetchAndBroadcast(subKey, subscription);
    }, pollingInterval);

    this.intervals.set(subKey, interval);
  }

  private async fetchAndBroadcast(
    subKey: string,
    subscription: Subscription,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      let data: any = null;

      console.log(
        `[WS Manager] 🔍 Fetching data for ${subKey} (type: ${subscription.type})`,
      );

      // Fetch data based on subscription type
      switch (subscription.type) {
        case "odds":
          if (subscription.marketIds && subscription.marketIds.length > 0) {
            data = await SportsService.getOdds({
              eventTypeId: subscription.eventTypeId,
              marketId: subscription.marketIds,
            });
          } else {
            data = [];
          }
          break;

        case "bookmakers":
          if (subscription.marketIds && subscription.marketIds.length > 0) {
            data = await SportsService.getBookmakers({
              eventTypeId: subscription.eventTypeId,
              marketId: subscription.marketIds,
            });
          } else {
            data = [];
          }
          break;

        case "sessions":
          if (subscription.matchId) {
            data = await SportsService.getSessions({
              eventTypeId: subscription.eventTypeId,
              matchId: subscription.matchId,
            });
          }
          break;

        case "score":
          if (subscription.matchId) {
            data = await SportsService.getScore({
              eventTypeId: subscription.eventTypeId,
              matchId: subscription.matchId,
            });
          }
          break;

        case "premium":
          if (subscription.matchId) {
            data = await SportsService.getPremiumFancy({
              eventTypeId: subscription.eventTypeId,
              matchId: subscription.matchId,
            });
          }
          break;

        case "matchDetails":
          if (subscription.matchId) {
            data = await SportsService.getMatchDetails({
              eventTypeId: subscription.eventTypeId,
              matchId: subscription.matchId,
            });
          }
          break;

        case "series":
          data = await this.fetchSeriesData(subscription.eventTypeId);
          break;
      }

      const fetchDuration = Date.now() - startTime;
      console.log(
        `[WS Manager] ✅ Fetched data for ${subKey} in ${fetchDuration}ms:`,
        {
          dataType: typeof data,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : data ? 1 : 0,
        },
      );

      // Broadcast to all subscribers
      if (data !== null && data !== undefined) {
        const subscribers = this.subscriptionMap.get(subKey);

        if (subscribers && subscribers.size > 0) {
          const message = {
            type: `${subscription.type}:update`,
            subscription: {
              eventTypeId: subscription.eventTypeId,
              marketIds: subscription.marketIds,
              matchId: subscription.matchId,
            },
            data,
          };

          console.log(
            `[WS Manager] 📤 Broadcasting to ${subscribers.size} client(s) for ${subKey}`,
          );

          let successCount = 0;
          let errorCount = 0;
          const deadClients: string[] = [];

          subscribers.forEach((clientId) => {
            const client = this.clients.get(clientId);
            if (client) {
              try {
                client.send(JSON.stringify(message));
                successCount++;
              } catch (error) {
                console.error(
                  `[WS Manager] ❌ Error sending to client ${clientId}:`,
                  error,
                );
                errorCount++;
                deadClients.push(clientId);
              }
            } else {
              console.warn(`[WS Manager] ⚠️ Client ${clientId} not found`);
              errorCount++;
              deadClients.push(clientId);
            }
          });

          console.log(
            `[WS Manager] 📊 Broadcast complete for ${subKey}: ${successCount} success, ${errorCount} errors`,
          );

          // Remove dead clients
          deadClients.forEach((clientId) => this.removeClient(clientId));
        } else {
          console.warn(`[WS Manager] ⚠️ No subscribers for ${subKey}`);
        }
      } else {
        console.warn(
          `[WS Manager] ⚠️ No data fetched for ${subKey} (data is null/undefined)`,
        );
      }
    } catch (error) {
      console.error(
        `[WS Manager] ❌ Error in fetchAndBroadcast for ${subKey}:`,
        error,
      );
    }
  }

  private async fetchSeriesData(eventTypeId: string): Promise<any[]> {
    const startTime = Date.now();

    try {
      // Step 1: Check if series structure is cached
      const seriesStructureKey = `series:structure:${eventTypeId}`;
      let seriesStructure = await CacheService.get(seriesStructureKey);

      if (!seriesStructure) {
        console.log(
          `[WS Manager] 🔄 Fetching fresh series structure for eventType ${eventTypeId}`,
        );

        // Fetch series list
        const seriesList = await SportsService.getSeriesList({
          eventTypeId: eventTypeId,
        });

        console.log(
          `[WS Manager] 📋 Found ${seriesList.length} series for eventType ${eventTypeId}`,
        );

        // Fetch matches for each series
        seriesStructure = await Promise.all(
          seriesList.map(async (series: any) => {
            const matches = await SportsService.getMatchList({
              eventTypeId: eventTypeId,
              competitionId: series.competition.id,
            });

            console.log(
              `[WS Manager] 📋 Series "${series.competition.name}": ${matches.length} matches`,
            );

            return {
              id: series.competition.id,
              name: series.competition.name,
              matches: matches.map((match: any) => ({
                ...match,
                // Structure only, no odds yet
              })),
            };
          }),
        );

        // Cache structure for 1 hour (structure doesn't change often)
        await CacheService.set(seriesStructureKey, seriesStructure, 60 * 60);
        console.log(
          `[WS Manager] 💾 Cached series structure for eventType ${eventTypeId}`,
        );
      } else {
        console.log(
          `[WS Manager] ♻️ Using cached series structure for eventType ${eventTypeId}`,
        );
      }

      // Step 2: Always fetch fresh odds for all matches
      console.log(
        `[WS Manager] 🎲 Fetching fresh odds for all matches in eventType ${eventTypeId}`,
      );

      const data = await Promise.all(
        (seriesStructure as any[]).map(async (series: any) => {
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
                  `[WS Manager] ❌ Failed to fetch odds for match ${match.id}:`,
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

      const duration = Date.now() - startTime;
      const totalMatches = data.reduce(
        (sum, series) => sum + series.matches.length,
        0,
      );

      console.log(
        `[WS Manager] ✅ Series data complete for eventType ${eventTypeId}:`,
        {
          seriesCount: data.length,
          totalMatches,
          duration: `${duration}ms`,
        },
      );

      return data;
    } catch (error) {
      console.error(
        `[WS Manager] ❌ Error fetching series data for eventType ${eventTypeId}:`,
        error,
      );
      return [];
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getSubscriptionCount(): number {
    return this.subscriptionMap.size;
  }

  // Debug method to see what's going on
  getDebugInfo(): any {
    return {
      clients: Array.from(this.clients.entries()).map(([id, client]) => ({
        id,
        subscriptions: Array.from(client.subscriptions),
      })),
      subscriptions: Array.from(this.subscriptionMap.entries()).map(
        ([key, clients]) => ({
          key,
          clientCount: clients.size,
          clients: Array.from(clients),
        }),
      ),
      activePolling: Array.from(this.intervals.keys()),
    };
  }
}

export const sportsWebSocketManager = new SportsWebSocketManager();
