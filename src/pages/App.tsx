import { WCLUrlInput } from "../components/WCLUrlInput";
import "../styles/App.scss";
import "../styles/classColors.scss";
import { FightBoxes } from "../components/FightBoxes";
/* import GetTopPumpers from "../components/GetTopPumpers"; */
import { useAppSelector } from "../redux/hooks";
import { SelectFightButtons } from "../components/SelectFightButtons";
/* import FindAttributionProblems from "../components/findAttributionProblems/FindAttributionProblems"; */
import EventNormalizer from "../components/eventNormalizer/EventNormalizer";

function App() {
  const fightReport = useAppSelector((state) => state.WCLUrlInput.fightReport);

  return (
    <>
      <h1>WCL URL</h1>
      <WCLUrlInput />
      {fightReport && (
        <>
          <h2>Select fights to analyze</h2>
          <SelectFightButtons />
          <FightBoxes />
          <EventNormalizer />
          {/* <GetTopPumpers /> */}
        </>
      )}
    </>
  );
}

export default App;
