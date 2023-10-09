import React from "react";
import { getEvents, EventVariables, getFights } from "../wcl/util/queryWCL";
import { DamageEvent, EventType } from "../wcl/events/types";

type GetEventsProps = {
  selectedFights: number[];
  reportCode: string;
};

const getFightEvent = async (selectedFights: number[], reportCode: string) => {
  console.log(reportCode);
  const variables: EventVariables = {
    reportID: reportCode,
    limit: 10000,
    startTime: 0,
    endTime: 0,
    filterExpression: `(source.type = "player" or source.type = "pet" and source.owner.type = "player") AND (supportedActor.id = 0)`,
  };

  const report = await getFights(variables);

  const fights = report?.fights?.filter((fight) => fight.difficulty);

  if (!fights) {
    return;
  }

  console.log("fights", fights);

  const eventMap: Record<number, DamageEvent[]> = {};

  for await (const fight of fights) {
    if (selectedFights.includes(fight.id)) {
      variables.startTime = fight.startTime;
      variables.endTime = fight.endTime;
      console.log(
        "getting events for:",
        fight.id,
        "&start=" + fight.startTime + "&end=" + fight.endTime
      );
      eventMap[fight.id] = await getEvents(variables, EventType.DamageEvent);
    }
  }

  console.log("eventMap", eventMap);

  for (const fightId of selectedFights) {
    const dammies = eventMap[fightId].reduce(
      (a, b) => a + b.amount + (b.absorbed ?? 0),
      0
    );
    console.log("fight:", fightId, "dammies:", dammies);
  }
  return;
};

const GetEvents: React.FC<GetEventsProps> = ({
  selectedFights,
  reportCode,
}) => {
  const handleButtonClick = async () => {
    console.log(selectedFights);
    await getFightEvent(selectedFights, reportCode);
  };

  return (
    <div>
      <button onClick={handleButtonClick}>Get Events</button>
    </div>
  );
};

export default GetEvents;
