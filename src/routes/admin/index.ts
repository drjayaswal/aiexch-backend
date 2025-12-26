import { Elysia } from "elysia";
import { app_middleware } from "../../middleware/auth";
import { bannersRoutes } from "./banners";
import { promocodesRoutes } from "./promocodes";
import { promotionsRoutes } from "./promotions";
import { usersRoutes } from "./users";
import { notificationsRoutes } from "./notifications";
import { popupsRoutes } from "./popups";
import { qrCodesRoutes } from "./qrcodes";
import { settingsRoutes } from "./settings";
import { sportsGamesRoutes } from "./sports-games";
import { homeSectionsRoutes } from "./home-sections";
import { kycRoutes } from "./kyc";
import { transactionsRoutes } from "./transactions";
import { whitelabelsRoutes } from "./whitelabels";
import { withdrawalMethodsRoutes } from "./withdrawal-methods";
import { casinoGamesAdminRoutes } from "./casino-games";
import { domainsRoutes } from "./domains";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store }) {
      const state_result = app_middleware({
        cookie,
        allowed: ["admin"],
      });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    },
  })
  .use(bannersRoutes)
  .use(promocodesRoutes)
  .use(promotionsRoutes)
  .use(usersRoutes)
  .use(notificationsRoutes)
  .use(popupsRoutes)
  .use(qrCodesRoutes)
  .use(settingsRoutes)
  .use(sportsGamesRoutes)
  .use(homeSectionsRoutes)
  .use(kycRoutes)
  .use(transactionsRoutes)
  .use(whitelabelsRoutes)
  .use(withdrawalMethodsRoutes)
  .use(casinoGamesAdminRoutes)
// .use((app) => domainsRoutes(app));
