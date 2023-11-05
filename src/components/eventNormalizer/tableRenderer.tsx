import { formatNumber } from "../../util/format";
import { AttributionHook } from "../../wcl/events/types";
import { Combatant } from "./combatant/combatants";
import { Fight } from "./generateFights";
import "./styling.scss";

const tableRenderer = (fights: Fight[]): JSX.Element => {
  /** This could easily be changed to be dynamic across multiple fights - but just leaving as is for now */
  const fight = fights[0];
  const combatants = fight.combatants;
  const normalizedDamageEvents = fight.events.normalizedDamageEvents;

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

  for (const player of combatants) {
    let wclDamage = 0;
    let normalizedDamage = 0;
    let fabricatedEvents = 0;

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
                supportEvent.event.amount + (supportEvent.event.absorbed ?? 0);
              fabricatedEvents += 1;
            }
          }
        }
      }
      if (!event.fabricated) {
        wclDamage += amount + stolenAmount;
      }

      normalizedDamage += amount;
    }

    const difference = normalizedDamage - wclDamage;

    playerDamage.push({
      combatant: player,
      wclAmount: wclDamage,
      normalizedAmount: normalizedDamage,
      difference: difference,
      differencePercent: difference / normalizedDamage,
      fabricatedEvents: fabricatedEvents,
    });
  }

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
        {(player.differencePercent * 100).toFixed(2)}%
      </td>
      <td>{player.fabricatedEvents}</td>
    </tr>
  ));

  return (
    <>
      <div>
        <table className="comparison-table">
          <tbody>
            {headerRow}
            {tableRows}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default tableRenderer;
