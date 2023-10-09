import { RequestDocument } from "graphql-request";
import { RootReport } from "../gql/types";
import { createGraphQLClient } from "../gql/graphqlClient";
import { getEventsQuery, getFightsQuery } from "../gql/queries";
import { AnyEvent, EventType } from "../events/types";

export type Variables = {
  reportID: string;
  fightIDs?: number[];
  startTime?: number;
  endTime?: number;
  limit?: number;
  filterExpression?: string;
};

export type EventVariables = Variables & {
  startTime: number;
  endTime: number;
};

export async function fetchReportData(
  requestType: RequestDocument,
  variables: Variables
) {
  const client = await createGraphQLClient();

  try {
    const data = (await client.request(requestType, variables)) as RootReport;

    const report = data.reportData.report;
    return report;
  } catch (error) {
    console.error("GraphQL request error:", error);
  }
}

export async function getFights(variables: Variables) {
  try {
    const response = await fetchReportData(getFightsQuery, variables);

    return response;
  } catch (error) {
    console.error("Error getting fights:", error);
  }
}

export async function getEvents<T extends AnyEvent>(
  variables: EventVariables,
  eventType?: EventType,
  previousEvents?: T[],
  recurse?: boolean
) {
  /** Xeph should fix so I don't need to do this.
   * Rare edgecase where you hit your limit and only get parsed some of the events on the endTime timestamp.
   * If nextPageTimestamp then is equal to endTime, WCL will throw a hissy fit. */
  if (variables.startTime === variables.endTime) {
    variables.endTime += 1;
  }

  /** Add event type filter if eventType is provided. */
  if (eventType && !recurse) {
    const eventFilter = `type = "${eventType}"`;
    variables.filterExpression += variables.filterExpression
      ? ` AND ` + eventFilter
      : eventFilter;
    console.log("filter:", variables.filterExpression);
  }

  const response = await fetchReportData(getEventsQuery, variables);

  console.log("response:", response);

  const { data = [], nextPageTimestamp = null } = response?.events ?? {};

  const allEvents: T[] = [...(previousEvents ?? []), ...(data as T[])];

  if (nextPageTimestamp) {
    return getEvents(
      { ...variables, startTime: nextPageTimestamp },
      eventType,
      allEvents,
      true
    );
  }

  return allEvents.sort((a, b) => a.timestamp - b.timestamp);
}
