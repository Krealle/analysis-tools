import { FightDataSet } from "../components/eventNormalizer/util/generateFights";
import { DamageEvent, NormalizedDamageEvent } from "../wcl/events/types";

export type SuspectEvents = {
  spellId: string;
  type: string;
  url: string;
};

export function generateCSVEntry(
  fightDataSet: FightDataSet,
  sourceEvent: NormalizedDamageEvent,
  supportEvent: DamageEvent,
  type: string
): SuspectEvents {
  const pin = `&pins=2%24Off%24rgb(78%25, 61%25, 43%25)%24expression%24supportedActor.name %3D '${sourceEvent.source.name}' or source.name %3D '${sourceEvent.source.name}' or supportedActor.owner.name %3D '${sourceEvent.source.name}'^0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24${sourceEvent.abilityGameID}^0%24Separate%24%23a04D8A%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152^0%24Separate%24%23DF5353%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24413984^0%24Separate%24rgb(78%25, 61%25, 43%25)%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24410089`;

  const wclUrl = `https://www.warcraftlogs.com/reports/${
    fightDataSet.fight.reportCode
  }#fight=${fightDataSet.fight.id}&type=damage-done&start=${
    sourceEvent.timestamp - 50
  }&end=${sourceEvent.timestamp + 50}&source=${
    supportEvent.sourceID
  }&view=events${pin}`;

  const spellId = sourceEvent.abilityGameID;

  const data = {
    spellId: `=HYPERLINK("https://www.wowhead.com/spell=${spellId}", "${spellId}")`,
    type: `${type}`,
    url: `=HYPERLINK("${wclUrl}", "Log")`,
  };

  return data;
}

export function convertToCSV(objArray: SuspectEvents[]) {
  const array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray;
  let str = "";

  // Generate header row
  const header = Object.keys(array[0]);
  str += header.join("|") + "\r\n";

  // Generate data rows
  for (let i = 0; i < array.length; i++) {
    let line = "";
    for (const index in array[i]) {
      if (line !== "") line += "|";
      line += array[i][index];
    }
    str += line + "\r\n";
  }

  return str;
}

export function downloadCSV(csvContent: string, fileName: string) {
  const csvFile = new Blob([csvContent], { type: "text/csv" });
  const downloadLink = document.createElement("a");
  downloadLink.download = `${fileName}.csv`;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
