import { useAppSelector } from "../redux/hooks";
import { formatDuration } from "../util/format";
import { useAppDispatch } from "../redux/hooks";
import { setSelectedIds } from "../redux/slices/fightBoxesSlice";
import ButtonCheckbox from "./generic/ButtonCheckbox";

export const FightBoxes = () => {
  const report = useAppSelector((state) => state.WCLUrlInput.fightReport);
  const selectedIds = useAppSelector((state) => state.fightBoxes.selectedIds);
  const dispatch = useAppDispatch();

  const handleDivClick = (id: number) => {
    const isSelected = selectedIds.includes(id);
    if (isSelected) {
      dispatch(
        setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
      );
    } else {
      dispatch(setSelectedIds([id]));
      //dispatch(setSelectedIds([...selectedIds, id]));
    }
  };

  if (!report?.fights) {
    return;
  }

  return (
    <div className="fights-container">
      {report.fights
        .filter((fight) => fight.difficulty)
        .map((fight) => (
          <ButtonCheckbox
            key={fight.id}
            onClick={() => handleDivClick(fight.id)}
            selected={selectedIds.includes(fight.id)}
            title={fight.name}
            flavorText={`${fight.id} - ${formatDuration(
              fight.endTime - fight.startTime
            )}${
              fight.kill
                ? " (kill)"
                : ` (wipe ${fight.fightPercentage}%${
                    fight.lastPhase ?? 0 > 0 ? ` P${fight.lastPhase}` : ""
                  })`
            }`}
            id={fight.kill ? "fight-kill" : "fight-wipe"}
          />
        ))}
    </div>
  );
};
