import { IntervalSet, TotInterval } from "../../../helpers/types";
import { mrtColorMap } from "../../../util/constants";
import { formatDuration } from "../../../util/format";
import { Combatant } from "../combatant/combatants";

export function getMRTNote(
  avgTopPumpersData: TotInterval[],
  combatants: Combatant[]
): string {
  const threshold: number = 1.5;
  const defaultTargets: Set<number> = getDefaultTargets(avgTopPumpersData);

  let note: string = "prescGlowsStart \n" + "defaultTargets - ";
  note += [...defaultTargets]
    .map((id) => {
      const player = combatants.find((player) => player.id === id);

      return mrtColorMap.get(player?.class ?? "") + (player?.name ?? "") + "|r";
    })
    .join(" ");
  note += "\n";

  avgTopPumpersData.forEach((interval, index) => {
    const dataSet: IntervalSet = interval.intervalEntries[0];
    const top2: Set<number> = new Set(
      dataSet.slice(0, 2).map((entry) => entry.id)
    );

    let isImportant: boolean = false;
    let top2Damage: number = 0;
    let defaultDamage: number = 0;

    for (const player of dataSet) {
      if (defaultTargets.has(player.id)) {
        defaultDamage += player.damage;
      }
      if (top2.has(player.id)) {
        top2Damage += player.damage;
      }
    }

    if (top2Damage > defaultDamage * threshold) {
      isImportant = true;
    }
    if (index === 0) {
      note += "PREPULL" + " - ";
    } else {
      note += formatDuration(interval.start) + " - ";
    }

    note += [...top2]
      .map((id) => {
        const player = combatants.find((player) => player.id === id);

        return (
          mrtColorMap.get(player?.class ?? "") + (player?.name ?? "") + "|r"
        );
      })
      .join(" ");

    note += `${isImportant ? " *" : ""} \n`;
  });

  note += "prescGlowsEnd";

  return note;
}

function getDefaultTargets(avgTopPumpersData: TotInterval[]) {
  const idSum = new Map<number, number>();

  for (const interval of avgTopPumpersData) {
    interval.intervalEntries[0].slice(0, 4).forEach((entry) => {
      const currentSum = idSum.get(entry.id) ?? 0;
      const sum = currentSum + entry.damage;

      idSum.set(entry.id, sum);
    });
  }

  const sortedIds = [...idSum.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const defaultTargets: Set<number> = new Set(sortedIds.map(([id]) => id));

  return defaultTargets;
}
