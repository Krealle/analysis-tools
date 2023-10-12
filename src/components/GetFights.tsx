import { getFights } from "../wcl/util/queryWCL";
import { formatDuration } from "../util/format";

interface GetFightsProps {
  code: string;
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
}

export const GetFights = async ({
  code,
  selectedIds,
  setSelectedIds,
}: GetFightsProps) => {
  const response = await getFights({ reportID: code });

  if (!response || !response.fights) {
    return null;
  }

  const fights = response.fights;

  const checkboxes = fights
    .filter((fight) => fight.difficulty)
    .map((fight) => (
      <div
        className="checkbox-fight"
        onClick={() => setSelectedIds([...selectedIds, fight.id])}
      >
        <input type="checkbox" id={fight.id.toString()} value={fight.id} />
        <label
          htmlFor={fight.id.toString()}
          id={fight.kill ? "fight-kill" : "fight-wipe"}
        >
          {fight.name}
          <br />
          <span className="flavor-text">
            Fight: {fight.id} -{" "}
            {formatDuration(fight.endTime - fight.startTime)}
            {fight.kill
              ? ` (kill)`
              : ` (wipe ${fight.fightPercentage}%${
                  fight.lastPhase ?? 0 > 0 ? ` P${fight.lastPhase}` : ""
                })`}
          </span>
        </label>
      </div>
    ));

  return checkboxes;
};

export const GetMetaData = async (code: string) => {
  const report = await getFights({ reportID: code });
  return report;
};
