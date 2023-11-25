import { useAppSelector } from "../redux/hooks";
import { formatDuration } from "../util/format";
import { useAppDispatch } from "../redux/hooks";
import { setSelectedIds } from "../redux/slices/fightBoxesSlice";
import ButtonCheckbox from "./generic/ButtonCheckbox";
import "../styles/FightBoxes.scss";

export const FightBoxes = () => {
  const report = useAppSelector((state) => state.WCLUrlInput.fightReport);
  const selectedIds = useAppSelector((state) => state.fightBoxes.selectedIds);
  const { isFetching } = useAppSelector((state) => state.status);
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

  // Group fights by name
  const fightsByName = report.fights.reduce((acc, fight) => {
    if (fight.difficulty) {
      const groupName = fight.name ?? "Unknown";
      acc[groupName] = acc[groupName] || [];
      acc[groupName].push(fight);
    }
    return acc;
  }, {} as Record<string, typeof report.fights>);

  return (
    <div>
      {Object.entries(fightsByName).map(([groupName, fights]) => (
        <div key={groupName} className="flex column">
          <div className="flex fightsName">{groupName}</div>
          <div className="flex fights">
            {fights.map((fight) => (
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
                    : ` (${fight.fightPercentage}%${
                        fight.lastPhase ?? 0 > 0 ? ` P${fight.lastPhase}` : ""
                      })`
                }`}
                id={fight.kill ? "fight-kill" : "fight-wipe"}
                disabled={isFetching}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
