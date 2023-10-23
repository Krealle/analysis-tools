import { WCLUrlInput } from "../components/WCLUrlInput";
import "../styles/App.scss";
import { FightBoxes } from "../components/FightBoxes";
import GetTopPumpers from "../components/GetTopPumpers";
import { useAppSelecter } from "../redux/hooks";
import { SelectFightButtons } from "../components/SelectFightButtons";

function App() {
  const fightReport = useAppSelecter((state) => state.WCLUrlInput.fightReport);

  return (
    <>
      <h1>WCL URL</h1>
      <WCLUrlInput />
      {fightReport && (
        <>
          <h2>Select fights to analyze</h2>
          <SelectFightButtons />
          <FightBoxes />
          <GetTopPumpers />
        </>
      )}
    </>
  );
}

export default App;
