import { useEffect, useState } from "react";
import { useAppSelector } from "../../redux/hooks";
import { Fight, generateFights } from "./generateFights";
import FightButtons from "../FightButtons";
import bearDancing from "/static/bear/dance.gif";
import tableRenderer from "./tableRenderer";
import { FormattedTimeSkipIntervals } from "../../helpers/types";
import { formatTime } from "../../util/format";
import { getAverageIntervals } from "./interval/intervals";
import intervalRenderer from "./interval/intervalRenderer";
import CustomFightParameters from "../fightParameters/CustomFightParameters";

let fights: Fight[] = [];
const enemyTracker = new Map<number, number>();

const EventNormalizer = () => {
  const [wclTableContent, setWclTableContent] = useState<JSX.Element | null>(
    null
  );
  const [intervalsContent, setIntervalsContent] = useState<JSX.Element | null>(
    null
  );
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [refreshData, setRefreshData] = useState<boolean>(false);

  const WCLReport = useAppSelector((state) => state.WCLUrlInput.fightReport);
  const selectedFights = useAppSelector(
    (state) => state.fightBoxes.selectedIds
  );
  const {
    parameterError,
    parameterErrorMsg,
    timeSkipIntervals,
    abilityNoEMScaling,
    abilityBlacklist,
    abilityNoScaling,
    enemyBlacklist,
    abilityNoShiftingScaling,
    ebonMightWeight,
    intervalTimer,
  } = useAppSelector((state) => state.customFightParameters);

  useEffect(() => {
    enemyTracker.clear();

    if (WCLReport && WCLReport.masterData && WCLReport.masterData.actors) {
      WCLReport.masterData.actors
        .filter((actor) => actor.type === "NPC")
        .forEach((actor) => {
          enemyTracker.set(actor.id, actor.gameID ?? -1);
        });
    }
  }, [WCLReport]);

  useEffect(() => {
    setRefreshData(true);
  }, [abilityNoEMScaling, abilityNoScaling, abilityNoShiftingScaling]);

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
        fights,
        abilityNoScaling.split(",").map(Number),
        abilityNoEMScaling.split(",").map(Number),
        abilityNoShiftingScaling.split(",").map(Number),
        refreshData
      );

      const fightsToRender = fights.filter((fight) =>
        selectedFights.includes(fight.fightId)
      );

      const wclTableContent = tableRenderer(
        fightsToRender,
        enemyTracker,
        abilityBlacklist.split(",").map(Number),
        enemyBlacklist
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

      const intervals = getAverageIntervals(
        fights,
        selectedFights,
        WCLReport.code,
        formattedTimeSkipIntervals,
        enemyTracker,
        abilityNoEMScaling.split(",").map(Number),
        abilityNoScaling.split(",").map(Number),
        ebonMightWeight,
        intervalTimer,
        abilityBlacklist.split(",").map(Number),
        enemyBlacklist
      );

      const intervalContent = intervalRenderer(intervals, fights[0].combatants);

      setWclTableContent(wclTableContent);
      setIntervalsContent(intervalContent);
      setRefreshData(false);
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
      <CustomFightParameters />
      {wclTableContent}
      {intervalsContent}
    </div>
  );
};

export default EventNormalizer;
