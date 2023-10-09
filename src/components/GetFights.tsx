import { format } from "date-fns";
import { getFights } from "../wcl/util/queryWCL";

const GetFights = async (code: string) => {
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
          {format(new Date(fight.endTime - fight.startTime), "mm:ss")}{" "}
          {fight.kill ? "(kill)" : "(wipe)"}
        </label>
      </div>
    ));

  return checkboxes;
};

export default GetFights;
