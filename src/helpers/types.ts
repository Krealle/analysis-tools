import { DamageEvent } from "../wcl/events/types";

export type FightTracker = {
  fightId: number;
  reportCode: string;
  startTime: number;
  endTime: number;
  actors: number[];
  events: DamageEvent[];
};

export type TotInterval = {
  currentInterval: number;
  start: number;
  end: number;
  intervalEntries: IntervalSet[];
};

export type IntervalSet = IntervalEntry[];

export type IntervalEntry = {
  id: number;
  damage: number;
};

export type TimeSkipIntervals = {
  start: string;
  end: string;
};

export type FormattedTimeSkipIntervals = {
  start: number;
  end: number;
};

export type TimeIntervals = {
  start: string;
  end: string;
};

export type FightParameters = {
  timeIntervals: TimeIntervals[];
  customBlacklist: string;
};
