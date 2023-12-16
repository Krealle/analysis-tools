import { AnyEvent } from "../../../wcl/events/types";
import { ReportFight, SummaryTable, WCLReport } from "../../../wcl/gql/types";
import { getFilter } from "../../../wcl/util/filters";
import {
  EventVariables,
  getEvents,
  getSummaryTable,
} from "../../../wcl/util/queryWCL";

export type FightDataSet = {
  fight: ReportFight;
  summaryTable: SummaryTable;
  events: AnyEvent[];
};

export async function fetchFightData(
  WCLReport: WCLReport,
  fightsToFetch: number[]
): Promise<FightDataSet[]> {
  const fightsToGenerate = WCLReport.fights!.filter((fight) =>
    fightsToFetch.includes(fight.id)
  );

  const fetchPromises = fightsToGenerate.map(async (fight) => {
    const variables: EventVariables = {
      reportID: WCLReport.code,
      fightIDs: [fight.id],
      startTime: fight.startTime,
      endTime: fight.endTime,
      limit: 10000,
    };
    const summaryTable = await getSummaryTable(variables);

    variables.filterExpression = getFilter();
    const events = await getEvents(variables);

    return {
      fight: { ...fight, reportCode: WCLReport.code },
      summaryTable: summaryTable,
      events: events,
    };
  });

  const result = await Promise.all(fetchPromises);

  return result;
}
