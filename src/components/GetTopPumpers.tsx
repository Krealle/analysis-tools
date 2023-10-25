import { useState } from "react";
import bearDancing from "/static/bear/dance.gif";
import CustomFightParameters from "./fightParameters/CustomFightParameters";
import {
  averageOutIntervals,
  handleFightData,
  handleMetaData,
  parseFights,
} from "../helpers/dataProcessing";
import { renderTableContent as renderTableContent } from "../helpers/contentRender";
import { FightTracker, FormattedTimeSkipIntervals } from "../helpers/types";
import { useAppSelector as useAppSelector } from "../redux/hooks";
import FightButtons from "./FightButtons";
import { formatTime } from "../util/format";

/** Global since we want to semi-persist data */
let fightTracker: FightTracker[] = [];

const GetTopPumpers = () => {
  const [content, setContent] = useState<JSX.Element | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const metaData = useAppSelector((state) => state.WCLUrlInput.fightReport);
  const selectedFights = useAppSelector(
    (state) => state.fightBoxes.selectedIds
  );
  const enemyBlacklist = useAppSelector(
    (state) => state.customFightParameters.enemyBlacklist
  );

  const {
    timeSkipIntervals,
    parameterError,
    parameterErrorMsg,
    abilityNoEMScaling,
    abilityNoBoEScaling,
    abilityNoScaling,
    abilityBlacklist,
  } = useAppSelector((state) => state.customFightParameters);

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
        <big>Fetching data</big>
        <br />
        <img src={bearDancing} />
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
    const { fights, petToPlayerMap, playerTracker, enemyTracker } = results;
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
      abilityBlacklist
    );

    const formattedTimeSkipIntervals: FormattedTimeSkipIntervals[] = [];
    for (const interval of timeSkipIntervals) {
      const formattedStartTime = formatTime(interval.start);
      const formattedEndTime = formatTime(interval.end);
      if (formattedStartTime && formattedEndTime) {
        formattedTimeSkipIntervals.push({
          start: formattedStartTime,
          end: formattedEndTime,
        });
      }
    }

    const topPumperData = handleFightData(
      selectedFights,
      metaData.code,
      fightTracker,
      formattedTimeSkipIntervals,
      petToPlayerMap,
      enemyBlacklist,
      enemyTracker,
      abilityNoEMScaling.split(",").map(Number),
      abilityNoBoEScaling.split(",").map(Number),
      abilityNoScaling.split(",").map(Number)
    );

    const avgTopPumpersData = averageOutIntervals(topPumperData);

    const content = renderTableContent(avgTopPumpersData, playerTracker);
    setContent(content);
  }

  return (
    <div className="pumpers-container">
      <FightButtons
        isFetching={isFetching}
        handleButtonClick={handleButtonClick}
      />
      <CustomFightParameters />
      {content}
    </div>
  );
};

export default GetTopPumpers;
