import { EnemyTracker } from "../../../helpers/types";
import { formatNumber } from "../../../util/format";
import { AttributionHook } from "../../../wcl/events/types";
import { Combatant } from "../combatant/combatants";
import { Fight } from "../util/generateFights";
import "../styling.scss";

const tableRenderer = (
  fights: Fight[],
  enemyTracker: EnemyTracker,
  abilityBlacklist: number[],
  enemyBlacklist: number[],
  deathCutOff: number
): JSX.Element => {
  const headerRow = (
    <tr>
      <th>Name</th>
      <th>WCL Amount</th>
      <th>Normalized Amount</th>
      <th>Difference</th>
      <th>Difference %</th>
      <th>Fabricated Events</th>
      <th>Empty Events</th>
    </tr>
  );

  const playerDamage: {
    combatant: Combatant;
    wclAmount: number;
    normalizedAmount: number;
    difference: number;
    differencePercent: number;
    fabricatedEvents: number;
    emptyEvents: number;
  }[] = [];
  let totalWclDamage = 0;
  let totalNormalizedDamage = 0;
  let totalDifference = 0;
  let totalFabricatedEvents = 0;
  let totalEmptyEvents = 0;

  for (const fight of fights) {
    const combatants = fight.combatants;
    const normalizedDamageEvents = fight.normalizedDamageEvents;

    const deathCutOffTime =
      deathCutOff <= fight.deathEvents.length && deathCutOff !== 0
        ? fight.deathEvents[deathCutOff - 1].timestamp
        : undefined;

    for (const player of combatants) {
      let wclDamage = 0;
      let normalizedDamage = 0;
      let fabricatedEvents = 0;
      let emptyEvents = 0;

      const playerEvents = normalizedDamageEvents.filter(
        (event) => event.source.id === player.id
      );

      for (const event of playerEvents) {
        if (
          enemyBlacklist.includes(enemyTracker.get(event.targetID) ?? -1) ||
          abilityBlacklist.includes(event.abilityGameID)
        ) {
          continue;
        }

        if (deathCutOffTime && event.timestamp >= deathCutOffTime) {
          break;
        }

        const amount = event.normalizedAmount;

        const stolenAmount = event.supportEvents.reduce((acc, supportEvent) => {
          if (supportEvent.hookType === AttributionHook.FABRICATED_HOOK) {
            acc += supportEvent.event.normalizedAmount;
            fabricatedEvents++;
          } else if (supportEvent.hookType === AttributionHook.EMPTY_HOOK) {
            acc += supportEvent.event.normalizedAmount;
            emptyEvents++;
          }

          return acc;
        }, 0);

        if (!event.fabricated && !event.modified) {
          wclDamage += amount + stolenAmount;
        }

        normalizedDamage += amount;
      }

      totalWclDamage += wclDamage;
      totalNormalizedDamage += normalizedDamage;
      totalFabricatedEvents += fabricatedEvents;
      totalEmptyEvents += emptyEvents;

      const curPlayerIndex = playerDamage.findIndex(
        (p) => p.combatant.id === player.id
      );

      if (curPlayerIndex !== -1) {
        playerDamage[curPlayerIndex].normalizedAmount += normalizedDamage;
        playerDamage[curPlayerIndex].wclAmount += wclDamage;
        playerDamage[curPlayerIndex].fabricatedEvents += fabricatedEvents;
      } else {
        playerDamage.push({
          combatant: player,
          wclAmount: wclDamage,
          normalizedAmount: normalizedDamage,
          difference: 0,
          differencePercent: 0,
          fabricatedEvents: fabricatedEvents,
          emptyEvents: emptyEvents,
        });
      }
    }
  }

  playerDamage.forEach((player) => {
    player.difference = player.normalizedAmount - player.wclAmount;
    player.differencePercent =
      Math.abs(
        (player.wclAmount - player.normalizedAmount) /
          Math.abs(player.wclAmount)
      ) * 100;
    totalDifference += player.difference;
  });

  const sortedPlayerDamage = playerDamage.sort(
    (a, b) => b.normalizedAmount - a.normalizedAmount
  );

  const tableRows: JSX.Element[] = sortedPlayerDamage.map((player, index) => (
    <tr
      key={player.combatant.name}
      className={index % 2 === 0 ? "even" : "odd"}
    >
      <td className="name">
        <span className={player.combatant.class}>{player.combatant.name} </span>
        <span className="spec">
          ({player.combatant.spec.replace(/(?<=[a-z])(?=[A-Z])/g, " ")})
        </span>
      </td>
      <td>{formatNumber(player.wclAmount)}</td>
      <td>{formatNumber(player.normalizedAmount)}</td>
      <td
        className={
          player.difference < 0
            ? "negative"
            : player.difference > 0
            ? "positive"
            : ""
        }
      >
        {formatNumber(player.difference)}
      </td>
      <td
        className={
          player.difference < 0
            ? "negative"
            : player.difference > 0
            ? "positive"
            : ""
        }
      >
        {player.difference < 0 && "-"}
        {player.differencePercent.toFixed(2)}%
      </td>
      <td>{player.fabricatedEvents}</td>
      <td>{player.emptyEvents}</td>
    </tr>
  ));

  /** This is essentially just for quick reference point */
  const bottomRow = (
    <tr>
      <td>Total</td>
      <td>{totalWclDamage}</td>
      <td>{Math.round(totalNormalizedDamage)}</td>
      <td>{Math.round(totalDifference)}</td>
      <td>{}</td>
      <td>{totalFabricatedEvents}</td>
      <td>{totalEmptyEvents}</td>
    </tr>
  );

  return (
    <>
      <div>
        <table className="comparison-table">
          <tbody>
            {headerRow}
            {tableRows}
            {bottomRow}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default tableRenderer;
