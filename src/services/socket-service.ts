// services/socket-service.ts
import { Server } from "socket.io";
import { createServer } from "http";
import { MarketCronService } from "./market-cron-service";

let io: Server;

export const initSocket = () => {
  const server = createServer();

  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3002"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 WebSocket client connected:", socket.id);

    socket.on("subscribe-markets", (eventId: string) => {
      socket.join(`event:${eventId}`);

      // Add to cron updates
      MarketCronService.addEvent(eventId);

      console.log(`📡 Client subscribed to ${eventId}`);
    });

    socket.on("unsubscribe-markets", (eventId: string) => {
      socket.leave(`event:${eventId}`);

      // Check if still has clients
      const room = io.sockets.adapter.rooms.get(`event:${eventId}`);
      if (!room || room.size === 0) {
        MarketCronService.removeEvent(eventId);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
    });
  });

  server.listen(3003, () => {
    console.log(`🔌 WebSocket server running on port 3003`);
  });

  // Start cron job
  MarketCronService.init();

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
