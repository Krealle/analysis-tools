import { formatDuration } from "../util/format";
import { ReportFight } from "../wcl/gql/types";

export const FightBoxes = ({
  fights,
  selectedIds,
  setSelectedIds,
}: {
  fights: ReportFight[] | undefined;
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
}) => {
  const handleDivClick = (id: number) => {
    const isSelected = selectedIds.includes(id);
    if (isSelected) {
      // Deselect the fight
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      // Select the fight
      setSelectedIds([...selectedIds, id]);
    }
  };

  if (!fights) {
    return;
  }

  return (
    <>
      {fights
        .filter((fight) => fight.difficulty)
        .map((fight) => (
          <div
            key={fight.id}
            className={`checkbox-fight ${
              selectedIds.includes(fight.id) ? "selected" : ""
            }`}
            id={fight.kill ? "fight-kill" : "fight-wipe"}
            onClick={() => handleDivClick(fight.id)}
          >
            <label>
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
