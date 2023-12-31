import { TotInterval } from "../../../helpers/types";
import { formatDuration, formatNumber } from "../../../util/format";
import { Combatant } from "../combatant/combatants";
import { getTop4Pumpers } from "../interval/intervals";
import "../../../styles/intervalRenderer.scss";
import { getMRTNote } from "../interval/mrtNote";

const intervalRenderer = (
  intervals: TotInterval[],
  combatants: Combatant[]
): JSX.Element => {
  if (intervals.length === 0) {
    return <>No data found</>;
  }
  const top4Pumpers: TotInterval[] = getTop4Pumpers(intervals);

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

  for (const interval of top4Pumpers) {
    const formattedEntriesTable: JSX.Element[][] = interval.intervalEntries.map(
      (entries) =>
        entries.map((player) => (
          <td key={player.id}>
            <span
              className={
                combatants.find((combatant) => combatant.id === player.id)
                  ?.class ?? ""
              }
            >
              {combatants.find((combatant) => combatant.id === player.id)
                ?.name ?? ""}{" "}
              - {formatNumber(player.damage)}
            </span>
          </td>
        ))
    );

    tableRows.push(
      <tr key={interval.currentInterval}>
        <td>
          {formatDuration(interval.start)} - {formatDuration(interval.end)}
        </td>
        {formattedEntriesTable}
      </tr>
    );
  }

  const mrtNote = getMRTNote(intervals, combatants);
  const noteTextbox = (
    <textarea readOnly value={mrtNote} className="mrtNoteTextbox" />
  );

  return (
    <>
      <table className="intervalTable">
        <tbody>
          {headerRow}
          {tableRows}
        </tbody>
      </table>
      {noteTextbox}
    </>
  );
};

export default intervalRenderer;
