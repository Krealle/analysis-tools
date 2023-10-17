import { useEffect, useState } from "react";
import { formatTime } from "../util/format";
import { Report } from "../wcl/gql/types";
import bearDancing from "/static/bear/dance.gif";
import CustomFightParameters from "./CustomFightParameters";
import {
  averageOutIntervals,
  handleFightData,
  handleMetaData,
  parseFights,
} from "../helpers/dataProcessing";
import { renderTableContent2 as renderTableContent } from "../helpers/contentRender";
import {
  FightParameters,
  FightTracker,
  TimeSkipIntervals,
} from "../helpers/types";

type Props = {
  selectedFights: number[];
  metaData: Report | undefined;
};

/** Global since we want to semi-persist data */
let fightTracker: FightTracker[] = [];
let timeSkipIntervals: TimeSkipIntervals[] = [];

// TODO: getDefaultTargets()
// TODO: getMRTNote()

const GetTopPumpers: React.FC<Props> = ({ selectedFights, metaData }) => {
  const [content, setContent] = useState<JSX.Element | null>(null);
  const [onlyBossDamage, setOnlyBossDamage] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [parameterError, setParameterError] = useState<boolean>(false);
  const [parameterErrorMsg, setParameterErrorMsg] = useState("");
  const [timeIntervals, setTimeIntervals] = useState([{ start: "", end: "" }]);
  const [customBlacklist, setCustomBlacklist] = useState("");

  useEffect(() => {
    setContent(null);
  }, [metaData]);

  const handleButtonClick = async () => {
    if (selectedFights.length === 0) {
      alert("No fight selected!");
      return;
    }
    if (parameterError) {
      alert(parameterErrorMsg);
      return;
    }

    setIsFetching(true);
    setContent(
      <>
        <img src={bearDancing} />
        <br />
        Fetching data from fight: 1/{selectedFights.length}
      </>
    );

    await findPumpers();
    setIsFetching(false);
  };

  async function findPumpers() {
    const results = handleMetaData(metaData);

    if (!results) {
      return;
    }
    const { fights, petToPlayerMap, playerTracker, bossIdList } = results;
    // TODO: make some sort of fallback
    if (!metaData) {
      console.log("GetTopPumpers - no fights found");
      return;
    }

    fightTracker = await parseFights(
      metaData.code,
      fights,
      selectedFights,
      fightTracker,
      customBlacklist
    );

    const topPumperData = handleFightData(
      selectedFights,
      metaData.code,
      fightTracker,
      bossIdList,
      timeSkipIntervals,
      petToPlayerMap,
      onlyBossDamage
    );

    const avgTopPumpersData = averageOutIntervals(topPumperData);

    const content = renderTableContent(avgTopPumpersData, playerTracker);
    setContent(content);
  }

  const handleParameterChange = (fightCustomParameters: FightParameters) => {
    const timeIntervalParam = fightCustomParameters.timeIntervals;
    const blacklist = fightCustomParameters.customBlacklist;
    timeSkipIntervals = [];

    for (const interval of timeIntervalParam) {
      const formatedStartTime = formatTime(interval.start);
      const formatedEndTime = formatTime(interval.end);
      if (
        !formatedStartTime ||
        !formatedEndTime ||
        formatedStartTime > formatedEndTime
      ) {
        setParameterErrorMsg("Invalid time interval");
        setParameterError(true);
        return;
      }
      timeSkipIntervals.push({
        start: formatedStartTime,
        end: formatedEndTime,
      });
    }

    /** In my eyes this is black magic but all
     * it does is check if blacklist format is correct:
     * eg. "23,25,25" / "24, 255, 23478" */
    const regex = /^(\s*\d+\s*,\s*)*\s*\d+\s*$/;
    const blackListValid = regex.test(blacklist);
    console.log("test");
    if (!blackListValid) {
      setParameterErrorMsg("Invalid blacklist");
      setParameterError(true);
      return;
    }

    setParameterError(false);
  };

  return (
    <>
      <div className="pumpers-content">
        <button onClick={handleButtonClick} disabled={isFetching}>
          Get Pumpers
        </button>
        <label className="only-boss-damage">
          <input
            type="checkbox"
            disabled={isFetching}
            onChange={(event) => setOnlyBossDamage(event.target.checked)}
          />
          <span>Only Boss Damage</span>
        </label>
      </div>
      <div className="pumpers-content">
        <CustomFightParameters
          onFightParameterChange={handleParameterChange}
          timeIntervals={timeIntervals}
          customBlacklist={customBlacklist}
          setTimeIntervals={setTimeIntervals}
          setCustomBlacklist={setCustomBlacklist}
        />
      </div>
      <div className="pumpers-content">{content}</div>
    </>
  );
};

export default GetTopPumpers;
