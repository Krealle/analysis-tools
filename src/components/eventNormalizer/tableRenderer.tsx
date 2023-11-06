import { formatNumber } from "../../util/format";
import { AttributionHook } from "../../wcl/events/types";
import { Combatant } from "./combatant/combatants";
import { Fight } from "./generateFights";
import "./styling.scss";

const tableRenderer = (fights: Fight[]): JSX.Element => {
  const headerRow = (
    <tr>
      <th>Name</th>
      <th>WCL Amount</th>
      <th>Normalized Amount</th>
      <th>Difference</th>
      <th>Difference %</th>
      <th>Fabricated Events</th>
    </tr>
  );

  const playerDamage: {
    combatant: Combatant;
    wclAmount: number;
    normalizedAmount: number;
    difference: number;
    differencePercent: number;
    fabricatedEvents: number;
  }[] = [];
  let totalWclDamage = 0;
  let totalNormalizedDamage = 0;

  for (const fight of fights) {
    const combatants = fight.combatants;
    const normalizedDamageEvents = fight.normalizedDamageEvents;
    for (const player of combatants) {
      let wclDamage = 0;
      let normalizedDamage = 0;
      let fabricatedEvents = 0;
      //const abilities: Record<number, number> = {};

      const playerEvents = normalizedDamageEvents.filter(
        (event) => event.source.id === player.id
      );

      for (const event of playerEvents) {
        const amount = event.normalizedAmount;

        let stolenAmount = 0;
        if (event.supportEvents) {
          if (event.supportEvents.length > 0) {
            for (const supportEvent of event.supportEvents) {
              if (supportEvent.hookType === AttributionHook.FABRICATED_HOOK) {
                stolenAmount +=
                  supportEvent.event.amount +
                  (supportEvent.event.absorbed ?? 0);
                fabricatedEvents += 1;
              }
            }
          }
        }
        if (!event.fabricated) {
          wclDamage += amount + stolenAmount;
        }
        /* if (event.abilityGameID in abilities) {
          abilities[event.abilityGameID] += event.fabricated
            ? 0
            : amount + stolenAmount;
        } else {
          abilities[event.abilityGameID] = event.fabricated
            ? 0
            : amount + stolenAmount;
        } */

        normalizedDamage += amount;
      }
      totalWclDamage += wclDamage;

      /* const abilitiesArray = Object.entries(abilities);
        abilitiesArray.sort((a, b) => b[1] - a[1]);
        console.log(player.name, abilitiesArray); */

      totalNormalizedDamage += normalizedDamage;

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
        <span className="spec">({player.combatant.spec})</span>
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
    </tr>
  ));

  /** This is essentially just for quick reference point
   * we currently have a discrepancy of ~0.004%
   * On Echo we have a discrepancy of ~0.18% most likely a weird interaction with the reduced damage
   * These already cause support events that steal too much (on blizzards end) */
  const bottomRow = (
    <tr>
      <td>Total</td>
      <td>{totalWclDamage}</td>
      <td>{Math.round(totalNormalizedDamage)}</td>
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
