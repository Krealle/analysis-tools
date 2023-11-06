import { useState } from "react";
import { useAppSelector } from "../../redux/hooks";
import { Fight, generateFights } from "./generateFights";
import FightButtons from "../FightButtons";
import bearDancing from "/static/bear/dance.gif";
import tableRenderer from "./tableRenderer";
import { FormattedTimeSkipIntervals } from "../../helpers/types";
import { formatTime } from "../../util/format";
import { getAverageIntervals } from "./interval/intervals";
import intervalRenderer from "./interval/intervalRenderer";
let fights: Fight[] = [];
const EventNormalizer = () => {
  const [wclTableContent, setWclTableContent] = useState<JSX.Element | null>(
    null
  );
  const [intervalsContent, setIntervalsContent] = useState<JSX.Element | null>(
    null
  );
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const WCLReport = useAppSelector((state) => state.WCLUrlInput.fightReport);
  const selectedFights = useAppSelector(
    (state) => state.fightBoxes.selectedIds
  );
  const {
    parameterError,
    parameterErrorMsg,
    timeSkipIntervals,
    abilityNoEMScaling,
    abilityNoBoEScaling,
    abilityNoScaling,
    abilityBlacklist,
    enemyBlacklist,
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
    setWclTableContent(
      <>
        <big>Fetching data</big>
        <br />
        <img src={bearDancing} />
      </>
    );
    setIntervalsContent(null);

    try {
      await attemptNormalize();
    } catch (error) {
      setWclTableContent(<>{error}</>);
    }

    setIsFetching(false);
  };

  async function attemptNormalize() {
    if (!WCLReport?.fights) {
      throw new Error("No fight report found");
    }

    try {
      fights = await generateFights(
        WCLReport,
        selectedFights,
        WCLReport.fights,
        fights
      );

      const fightsToRender = fights.filter((fight) =>
        selectedFights.includes(fight.fightId)
      );

      const wclTableContent = tableRenderer(fightsToRender);

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

      const intervals = getAverageIntervals(
        fights,
        selectedFights,
        WCLReport.code,
        formattedTimeSkipIntervals
      );

      const intervalContent = intervalRenderer(intervals, fights[0].combatants);

      setWclTableContent(wclTableContent);
      setIntervalsContent(intervalContent);
    } catch (error) {
      setWclTableContent(<>{error}</>);
    }

    setIsFetching(false);
  }

  return (
    <div className="pumpers-container">
      <FightButtons
        isFetching={isFetching}
        handleButtonClick={handleButtonClick}
      />
      {wclTableContent}
      {intervalsContent}
    </div>
  );
};

export default EventNormalizer;
