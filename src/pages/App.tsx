import { WCLUrlInput } from "../components/WCLUrlInput";
import "../styles/App.scss";
import { FightBoxes } from "../components/FightBoxes";
import GetTopPumpers from "../components/GetTopPumpers";
import { useAppDispatch, useAppSelecter } from "../redux/hooks";
import { setSelectedIds } from "../redux/slices/FightBoxesSlice";

function App() {
  const fightReport = useAppSelecter((state) => state.WCLUrlInput.fightReport);
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
    <>
      <h1>WCL URL</h1>
      <WCLUrlInput />
      {fightReport && (
        <>
          <h2>Select fights to analyze</h2>
          <div className="select-fights-button-container">
            <button onClick={() => handleSelectFights()}>
              Select All Fights
            </button>
            <button onClick={() => handleSelectFights(true)}>
              Select All Kills
            </button>
            <button onClick={() => handleSelectFights(false)}>
              Select All Wipes
            </button>
          </div>
          <div className="fights-container">
            <FightBoxes />
          </div>
          <div className="pumpers-container">
            <GetTopPumpers />
          </div>
        </>
      )}
    </>
  );
}

export default App;
