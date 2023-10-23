import { useState } from "react";
import bearDancing from "/static/bear/dance.gif";
import CustomFightParameters from "./CustomFightParameters";
import {
  averageOutIntervals,
  handleFightData,
  handleMetaData,
  parseFights,
} from "../helpers/dataProcessing";
import { renderTableContent as renderTableContent } from "../helpers/contentRender";
import { FightTracker } from "../helpers/types";
import { useAppDispatch, useAppSelecter } from "../redux/hooks";
import { setShowOptions } from "../redux/slices/customFightParametersSlice";

/** Global since we want to semi-persist data */
let fightTracker: FightTracker[] = [];

// TODO: getDefaultTargets()
// TODO: getMRTNote()

const GetTopPumpers = () => {
  const [content, setContent] = useState<JSX.Element | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const showOptions = useAppSelecter(
    (state) => state.customFightParameters.showOptions
  );

  const metaData = useAppSelecter((state) => state.WCLUrlInput.fightReport);
  const selectedFights = useAppSelecter(
    (state) => state.fightBoxes.selectedIds
  );

  const {
    timeSkipIntervals,
    customBlacklist,
    onlyBossDamage,
    parameterError,
    parameterErrorMsg,
  } = useAppSelecter((state) => state.customFightParameters);

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

  return (
    <div className="pumpers-container">
      <div className="pumpers-content">
        <button
          onClick={handleButtonClick}
          disabled={isFetching || showOptions}
        >
          Get Pumpers
        </button>
        <button
          onClick={() => dispatch(setShowOptions(!showOptions))}
          disabled={isFetching || parameterError}
        >
          {showOptions
            ? parameterError
              ? " Invalid Parameters"
              : "Hide options"
            : "Show options"}
        </button>
      </div>
      <CustomFightParameters />
      {content}
    </div>
  );
};

export default GetTopPumpers;
