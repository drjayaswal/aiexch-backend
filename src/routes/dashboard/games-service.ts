import { getAvailableSportsList } from "@services/sports-service";
import Elysia from "elysia";


export const seriesRoutes = new Elysia({ prefix: "/api/dashboard" })
 .get("/sports-list", async () => {
    console.log("yhaaaa")
    const sportsList = await getAvailableSportsList();

    return {
      success: true,
      data: sportsList,
      count: sportsList.length,
    };
  });

