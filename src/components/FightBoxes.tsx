import { useAppSelecter } from "../redux/hooks";
import { formatDuration } from "../util/format";
import { useAppDispatch } from "../redux/hooks";
import { setSelectedIds } from "../redux/slices/FightBoxesSlice";

export const FightBoxes = () => {
  const report = useAppSelecter((state) => state.WCLUrlInput.fightReport);
  const selectedIds = useAppSelecter((state) => state.fightBoxes.selectedIds);
  const dispatch = useAppDispatch();

  const handleDivClick = (id: number) => {
    const isSelected = selectedIds.includes(id);
    if (isSelected) {
      dispatch(
        setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
      );
    } else {
      dispatch(setSelectedIds([...selectedIds, id]));
    }
  };

  if (!report?.fights) {
    return;
  }

  return (
    <>
      {report.fights
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
            <div>
              <span className="fight-name">{fight.name}</span>
              <br />
              <span className="flavor-text">
                {fight.id} - {formatDuration(fight.endTime - fight.startTime)}
                {fight.kill
                  ? ` (kill)`
                  : ` (wipe ${fight.fightPercentage}%${
                      fight.lastPhase ?? 0 > 0 ? ` P${fight.lastPhase}` : ""
                    })`}
              </span>
            </div>
          </div>
        ))}
    </>
  );
};
