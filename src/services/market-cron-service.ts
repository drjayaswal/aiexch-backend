// services/market-cron-service.ts
import cron from "node-cron";
import { SportsService } from "./sports";

// Track events that need updates
const activeEvents = new Set<string>();

export class MarketCronService {
  static init() {
    console.log("⏰ Starting market update cron job (1s interval)...");

    // Run every 1 second
    cron.schedule("* * * * * *", async () => {
      await this.updateMarkets();
    });

    console.log("✅ Market cron service started");
  }

  // Add event to active updates
  static addEvent(eventId: string) {
    activeEvents.add(eventId);
    console.log(`➕ Added event ${eventId} to cron updates`);
  }

  // Remove event from updates
  static removeEvent(eventId: string) {
    activeEvents.delete(eventId);
    console.log(`➖ Removed event ${eventId} from cron updates`);
  }

  private static async updateMarkets() {
    const events = Array.from(activeEvents);

    if (events.length === 0) {
      return; // No active events
    }

    for (const eventId of events) {
      try {
        await this.updateSingleMarket(eventId);
      } catch (error) {
        console.error(`❌ Error updating ${eventId}:`, error);
      }
    }
  }

  private static async updateSingleMarket(eventId: string) {
    // Call your existing function
    const marketsWithOdds = await SportsService.getMarketsWithOdds({ eventId });
    // Your function already emits via WebSocket
    console.log(`🔄 Updated ${eventId}: ${marketsWithOdds.length} markets`);
  }
}
