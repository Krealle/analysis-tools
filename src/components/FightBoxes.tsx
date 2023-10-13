import { formatDuration } from "../util/format";
import { ReportFight } from "../wcl/gql/types";

export const FightBoxes = ({
  fights,
  setSelectedIds,
}: {
  fights: ReportFight[] | undefined;
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
}) => {
  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: number
  ) => {
    const isChecked = e.target.checked;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setSelectedIds((prevSelectedIds: number[]) => {
      if (isChecked) {
        return [...prevSelectedIds, id];
      } else {
        return prevSelectedIds.filter((selectedId) => selectedId !== id);
      }
    });
  };

  if (!fights) {
    return;
  }

  return (
    <>
      {fights
        .filter((fight) => fight.difficulty)
        .map((fight) => (
          <div key={fight.id} className="checkbox-fight">
            <input
              type="checkbox"
              id={fight.id.toString()}
              value={fight.id}
              onChange={(e) => handleCheckboxChange(e, fight.id)}
            />
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
        ))}
    </>
  );
};
