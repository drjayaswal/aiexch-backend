export interface Odds {
  eventid: string;
  marketId: string;
  market: string;
  updateTime: string; // ISO date string
  status: string;
  inplay: boolean;
  totalMatched: number;
  active: boolean;
  markettype: string; // e.g., "ODDS"
  runners: Runner[];
  min: string;
  max: string;
}

export interface Runner {
  selectionId: number;
  runner: string;
  status: string;
  lastPriceTraded: number;
  removalDate: string; // ISO date string
  ex: Exchange;
  back: PriceLevel[];
  lay: PriceLevel[];
}

export interface Exchange {
  availableToBack: PriceLevel[];
  availableToLay: PriceLevel[];
}

export interface PriceLevel {
  level: number;
  price: number;
  size: number;
}

export interface FancyMarket {
  eventid: number;
  marketId: string;
  market: string;
  status: string;
  runners: {
    selectionId: number;
    runnerName: string;
    back: { price: number }[];
    lay: { price?: number }[]; // sometimes empty
    status: string;
  }[];
}

export interface SessionItem {
  RunnerName: string;
  LayPrice1: number;
  LaySize1: number;
  LayPrice2: number;
  LaySize2: number;
  LayPrice3: number;
  LaySize3: number;
  BackPrice1: number;
  BackSize1: number;
  BackPrice2: number;
  BackSize2: number;
  BackPrice3: number;
  BackSize3: number;
  GameStatus: string;
  SelectionId: string;
  sr_no?: number; // sometimes it can be "srno" instead
  srno?: string;
  ballsess?: number;
  min: string;
  max: string;
  gtype: string;
  rem: string;
}

export interface BookmakerRunner {
  selectionId: number;
  runnerName: string;
  handicap: number;
  status: string;
  lastPriceTraded: number;
  totalMatched: number;
  back: {
    price1: number;
    price: number;
    size: string;
  }[];
  lay: {
    price1: number;
    price: number;
    size: string;
  }[];
  ex: {
    availableToBack: {
      price: number;
      size: string;
      price1: number;
    }[];
    availableToLay: {
      price: number;
      size: string;
      price1: number;
    }[];
  };
}

export interface BookmakerItem {
  marketId: string;
  evid: string;
  inplay: boolean;
  isMarketDataDelayed: boolean;
  status: string;
  provider: string;
  betDelay: number;
  bspReconciled: boolean;
  complete: boolean;
  numberOfWinners: number;
  numberOfRunners: number;
  numberOfActiveRunners: number;
  lastMatchTime: string;
  totalMatched: number;
  totalAvailable: number;
  crossMatching: boolean;
  runnersVoidable: boolean;
  version: number;
  runners: BookmakerRunner[];
  min: string;
  max: string;
  mname: string;
  rem: string;
}
