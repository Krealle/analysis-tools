import { formatDuration, formatNumber } from "../util/format";
import { Actor } from "../wcl/gql/types";
import { getMRTNote, getTop4Pumpers } from "./dataProcessing";
import { TotInterval } from "./types";

export function renderTableContent(
  avgTopPumpersData: TotInterval[],
  playerTracker: Map<number, Actor>
): JSX.Element {
  if (avgTopPumpersData.length === 0) {
    return <>No data found</>;
  }
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

  for (const interval of top4Pumpers) {
    const formattedEntriesTable: JSX.Element[][] = interval.intervalEntries.map(
      (entries) =>
        entries.map((player) => (
          <td key={player.id}>
            <span className={playerTracker.get(player.id)?.subType}>
              {playerTracker.get(player.id)?.name} -{" "}
              {formatNumber(player.damage)}
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

  const mrtNote = getMRTNote(avgTopPumpersData, playerTracker);
  const noteTextbox = (
    <textarea readOnly value={mrtNote} className="mrtNoteTextbox" />
  );

  return (
    <>
      <div className="pumpers-content">
        <table className="pumperTable">
          <tbody>
            {headerRow}
            {tableRows}
          </tbody>
        </table>
      </div>
      {noteTextbox}
    </>
  );
}
