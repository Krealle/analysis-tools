import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setSelectedIds } from "../redux/slices/fightBoxesSlice";

export const SelectFightButtons = () => {
  const fightReport = useAppSelector((state) => state.WCLUrlInput.fightReport);
  const dispatch = useAppDispatch();

  const handleSelectFights = (selectKills?: boolean) => {
    if (fightReport && fightReport.fights) {
      const allFightIds = fightReport.fights
        .filter((fight) => {
          return fight.difficulty !== null;
        })
        .filter((fight) => {
          if (selectKills === undefined) {
            return fight.difficulty !== null;
          } else {
            return fight.difficulty !== null && selectKills
              ? fight.kill
              : !fight.kill;
          }
        })
        .map((fight) => fight.id);
      dispatch(setSelectedIds(allFightIds));
    }
  };

  return (
    <div className="flex gap">
      <button onClick={() => handleSelectFights()}>Select All Fights</button>
      <button onClick={() => handleSelectFights(true)}>Select All Kills</button>
      <button onClick={() => handleSelectFights(false)}>
        Select All Wipes
      </button>
    </div>
  );
};
