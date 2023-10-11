import { useState } from "react";
import { DamageEvent, EventType } from "../wcl/events/types";
import { PlayerDetails, Actor, ReportFight } from "../wcl/gql/types";
import {
  EventVariables,
  Variables,
  getEvents,
  getFights,
  getPlayerDetails,
} from "../wcl/util/queryWCL";

type Props = {
  selectedFights: number[];
  reportCode: string;
};

type FightTracker = {
  fightId: number;
  startTime: number;
  endTime: number;
  actors: number[];
  events: DamageEvent[];
};

type TotInterval = {
  currentInterval: number;
  intervalEntries: IntervalSet[];
};

type IntervalSet = IntervalEntry[];

type IntervalEntry = {
  id: number;
  damage: number;
};

/** Global since we want to semi-persist data */
const fightTracker: FightTracker[] = [];
const playerTracker = new Map<number, Actor>();
const petToPlayerMap = new Map<number, number>();

function getFilter(playerDetails: PlayerDetails) {
  const nameFilter = playerDetails.dps
    .map((player) => `"${player.name}"`)
    .join(`,`);

  const filter = `(source.name in (${nameFilter}) OR source.owner.name in (${nameFilter})) 
    AND (target.id != source.id)
    AND (supportedActor.id = 0) 
    AND target.id not in(169428, 169430, 169429, 169426, 169421, 169425, 168932)
    AND not (target.id = source.owner.id)
    AND not (source.id = target.owner.id)`;

  return filter;
}

async function genMetaData(reportCode: string) {
  const variables: Variables = {
    reportID: reportCode,
    limit: 10000,
  };

  const report = await getFights(variables);

  if (!report || !report.fights || !report.masterData) {
    console.log("genMetaData - no report found");
    return null;
  }
  console.log("genMetaData - report found:", report);

  /** Link pet to owner
   * and populate playerTracker for class informations */
  if (report.masterData.actors) {
    const pets: number[] = [];
    for (const actor of report.masterData.actors) {
      if (actor.petOwner) {
        petToPlayerMap.set(actor.id, actor.petOwner);
        pets.push(actor.id);
      }
      if (actor.type === "Player") {
        playerTracker.set(actor.id, actor);
      }
    }
  }

  return report.fights;
}

async function parseFights(
  reportCode: string,
  fights: ReportFight[],
  selectedFights: number[]
) {
  const variables: EventVariables = {
    reportID: reportCode,
    limit: 10000,
    startTime: 0,
    endTime: 0,
  };

  for (const fight of fights) {
    if (
      !fight.difficulty ||
      fightTracker.some((entry) => entry.fightId === fight.id) ||
      !selectedFights.includes(fight.id)
    ) {
      console.log("parseFights - Skipping fight");
      continue;
    }

    variables.startTime = fight.startTime;
    variables.endTime = fight.endTime;
    variables.fightIDs = [fight.id]; // TODO: maybe remove

    const playerDetails = await getPlayerDetails(variables);

    if (playerDetails) {
      const filter = getFilter(playerDetails);
      variables.filterExpression = filter;
    }

    console.log("parseFights - fetching events for:", fight);
    const events = (await getEvents(
      variables,
      EventType.DamageEvent
    )) as DamageEvent[];

    console.log("parseFights - fetched events:", events);
    fightTracker.push({
      fightId: fight.id,
      startTime: fight.startTime,
      endTime: fight.endTime,
      actors: fight.friendlyPlayers ?? [],
      events: events,
    });
  }

  return;
}

function handleFightData(selectedFights: number[]): TotInterval[] {
  const sortedIntervals: TotInterval[] = [];

  for (const fight of fightTracker) {
    if (!selectedFights.includes(fight.fightId)) {
      continue;
    }

    let currentInterval = 1;

    // TODO: should be variable
    const intervalDur = 30_000;
    let intervalTimer = fight.startTime;
    let interval: IntervalSet = [];

    for (const event of fight.events) {
      if (event.timestamp > intervalTimer + intervalDur) {
        const sortedInterval = interval.slice();
        sortedInterval.sort((a, b) => b.damage - a.damage);

        const existingEntry = sortedIntervals.find(
          (entry) => entry.currentInterval === currentInterval
        );

        if (existingEntry) {
          existingEntry.intervalEntries.push(sortedInterval);
        } else {
          sortedIntervals.push({
            currentInterval,
            intervalEntries: [sortedInterval],
          });
        }

        intervalTimer = event.timestamp;
        interval = [];
        currentInterval++;
      }

      const sourceID = petToPlayerMap.get(event.sourceID) ?? event.sourceID;

      const intervalEntry = interval.find((entry) => entry.id === sourceID);
      const amount = event.amount + (event.absorbed ?? 0);
      if (intervalEntry) {
        intervalEntry.damage += amount;
      } else {
        interval.push({
          id: sourceID,
          damage: amount,
        });
      }
    }
  }
  /**
   * potentially we want to look at events that in the end of a fight, but didnt happen within
   * an entire interval, with averaging across many pulls this can kinda get skewed, data-wise
   * so for now we just ignore them.
   */
  return sortedIntervals;
}

function averageOutIntervals(totIntervals: TotInterval[]): TotInterval[] {
  const avgIntervals: TotInterval[] = [];

  for (const entry of totIntervals) {
    const currentInterval = entry.currentInterval;
    const intervalData: {
      [id: number]: { totalDamage: number; count: number };
    } = {};

    for (const interval of entry.intervalEntries) {
      for (const { id, damage } of interval) {
        if (!intervalData[id]) {
          intervalData[id] = { totalDamage: damage, count: 1 };
        } else {
          intervalData[id].totalDamage += damage;
          intervalData[id].count++;
        }
      }
    }

    const intervalSet: IntervalEntry[] = Object.keys(intervalData).map(
      (id) => ({
        id: +id,
        damage: intervalData[+id].totalDamage / intervalData[+id].count,
      })
    );

    const sortedIntervalSet = intervalSet.sort((a, b) => b.damage - a.damage);

    avgIntervals.push({
      currentInterval: currentInterval,
      intervalEntries: [sortedIntervalSet],
    });
  }

  return avgIntervals;
}

function getTop4Pumpers(topPumpersData: TotInterval[]): TotInterval[] {
  return topPumpersData.map((interval) => ({
    currentInterval: interval.currentInterval,
    intervalEntries: [interval.intervalEntries[0].slice(0, 4)],
  }));
}

// TODO: getDefaultTargets()
// TODO: getMRTNote()

function renderTableContent(avgTopPumpersData: TotInterval[]): JSX.Element {
  const top4Pumpers: TotInterval[] = getTop4Pumpers(avgTopPumpersData);

  const tableRows: JSX.Element[] = [];
  const headerRow = (
    <tr>
      <th>Time</th>
      <th>Player - Damage</th>
      <th>Player - Damage</th>
      <th>Player - Damage</th>
      <th>Player - Damage</th>
    </tr>
  );

  // TODO: copy box for MRT note
  // TODO: interval shouldn't be static
  let intervalStart = 0;
  for (const interval of top4Pumpers) {
    const intervalEnd = intervalStart + 30;
    const formattedEntriesTable: JSX.Element[][] = interval.intervalEntries.map(
      (entries) =>
        entries.map((player) => (
          <td key={player.id}>
            <span className={playerTracker.get(player.id)?.subType}>
              {playerTracker.get(player.id)?.name} -{" "}
              {player.damage.toLocaleString()}
            </span>
          </td>
        ))
    );

    tableRows.push(
      <tr key={interval.currentInterval}>
        <td>{`${intervalStart} - ${intervalEnd}`}</td>
        {formattedEntriesTable}
      </tr>
    );
    intervalStart += 30;
  }

  return (
    <div>
      <table>
        <tbody className="table">
          {headerRow}
          {tableRows}
        </tbody>
      </table>
    </div>
  );
}

const GetTopPumpers: React.FC<Props> = ({ selectedFights, reportCode }) => {
  const [content, setContent] = useState<JSX.Element | null>(null);

  const handleButtonClick = async () => {
    console.log("GetTopPumpers - selected fights:", selectedFights);
    await findPumpers();
  };

  async function findPumpers() {
    const fights = await genMetaData(reportCode);
    console.log("GetTopPumpers - fights:", fights);

    // TODO: make some sort of fallback
    if (!fights) {
      console.log("GetTopPumpers - no fights found");
      return;
    }

    await parseFights(reportCode, fights, selectedFights);
    console.log("GetTopPumpers - fightTracker:", fightTracker);

    const topPumpersData = handleFightData(selectedFights);
    console.log("GetTopPumpers - topPumpersData:", topPumpersData);

    const avgTopPumpersData = averageOutIntervals(topPumpersData);
    console.log("GetTopPumpers - avgTopPumpersData:", avgTopPumpersData);

    const content = renderTableContent(avgTopPumpersData);
    setContent(content);
  }

  return (
    <div>
      <button onClick={handleButtonClick}>Get Pumpers</button>
      {content}
    </div>
  );
};

export default GetTopPumpers;
