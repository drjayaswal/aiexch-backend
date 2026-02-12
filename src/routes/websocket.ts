// routes/websocket.ts
import { Elysia } from "elysia";
import {
  subscribeToEvent,
  unsubscribeFromEvent,
  cleanupSocket,
} from "@services/socket-service";

export const websocketRoutes = new Elysia({ prefix: "/ws" }).ws("/markets", {
  open(ws) {
    console.log("🔌 WebSocket client connected");
  },
  message(ws, message) {
    try {
      const data = typeof message === "string" ? JSON.parse(message) : message;

      if (data.type === "subscribe-markets") {
        const eventId = data.eventId;
        if (eventId) {
          subscribeToEvent(ws, eventId);
        }
      } else if (data.type === "unsubscribe-markets") {
        const eventId = data.eventId;
        if (eventId) {
          unsubscribeFromEvent(ws, eventId);
        }
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        }),
      );
    }
  },
  close(ws) {
    cleanupSocket(ws);
  },
});
