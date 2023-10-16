import { useState } from "react";
import { WCLUrlInput } from "../components/WCLUrlInput";
import "../styles/App.scss";
import { Report } from "../wcl/gql/types";
import { FightBoxes } from "../components/FightBoxes";
import GetTopPumpers from "../components/GetTopPumpers";

function App() {
  const [fightReport, setFightReport] = useState<Report | undefined>();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  console.log("fightReport", fightReport);
  console.log("selectedIds", selectedIds);

  const handleFightChange = (newFightReport: Report | undefined) => {
    setFightReport(newFightReport);
    setSelectedIds([]);
  };

  const handleSelectFights = (selectKills?: boolean) => {
    if (fightReport && fightReport.fights) {
      const allFightIds = fightReport.fights
        .filter((fight) => {
          if (selectKills === undefined) {
            return fight.difficulty;
          } else {
            return fight.difficulty && selectKills ? fight.kill : !fight.kill;
          }
        })
        .map((fight) => fight.id);
      setSelectedIds(allFightIds);
    }
  };

  return (
    <>
      <h1>WCL URL</h1>
      <WCLUrlInput onFightChange={handleFightChange} />
      {fightReport && (
        <>
          <h2>Select fights to analyze</h2>
          <button onClick={() => handleSelectFights()}>
            Select All Fights
          </button>
          <button onClick={() => handleSelectFights(true)}>
            Select All Kills
          </button>
          <button onClick={() => handleSelectFights(false)}>
            Select All Wipes
          </button>
          <div className="fights-container">
            <FightBoxes
              fights={fightReport.fights}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
            />
          </div>
          <div className="pumpers-container">
            <GetTopPumpers
              selectedFights={selectedIds}
              metaData={fightReport}
            />
          </div>
        </>
      )}
    </>
  );
}

export default App;
