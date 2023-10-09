export type RootReport = {
  reportData: ReportData;
};

export type ReportData = {
  report: Report;
};

export type Report = {
  title: string;
  code: string;
  endtime: number;
  events?: ReportEventPaginator;
  fights?: ReportFight[];
  table?: JSON;
};

export type ReportFight = {
  id: number;
  startTime: number;
  endTime: number;
  gameZone: GameZone;
  name?: string;
  difficulty?: number;
  kill?: boolean;
};

export type GameZone = {
  id: number;
};

export type ReportEventPaginator = {
  // The list of events obtained.
  data: JSON;
  // A timestamp to pass in as the start time when fetching the next page of data.
  nextPageTimestamp: number;
};
