import { getFights } from "../wcl/util/queryWCL";
import { formatDuration } from "../util/format";

export const GetFights = async (code: string) => {
  const response = await getFights({ reportID: code });

  if (!response || !response.fights) {
    return null;
  }

  const fights = response.fights;

  const checkboxes = fights
    .filter((fight) => fight.difficulty)
    .map((fight) => (
      <div key={fight.id} className="checkbox-container">
        <label>
          <input type="checkbox" value={fight.id} />
          {fight.name} #{fight.id} - Duration:{" "}
          {formatDuration(fight.endTime - fight.startTime)}{" "}
          {fight.kill ? "(kill)" : "(wipe)"}
        </label>
      </div>
    ));

  return checkboxes;
};

export const genMetaData = async (code: string) => {
  const report = await getFights({ reportID: code });
  return report;
};
