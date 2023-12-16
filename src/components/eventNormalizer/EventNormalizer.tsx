import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { Fight, generateFights } from "./util/generateFights";
import FightButtons from "../FightButtons";
import bearDancing from "/static/bear/dance.gif";
import tableRenderer from "./renders/tableRenderer";
import { FormattedTimeSkipIntervals } from "../../helpers/types";
import { formatTime } from "../../util/format";
import { getAverageIntervals } from "./interval/intervals";
import intervalRenderer from "./renders/intervalRenderer";
import CustomFightParameters from "../fightParameters/CustomFightParameters";
import { setIsFetching } from "../../redux/slices/statusSlice";
import { Combatant } from "./combatant/combatants";
import ErrorBear from "../generic/ErrorBear";
import { ReportParseError } from "../../wcl/util/parseWCLUrl";

export type AbilityFilters = {
  noScaling: number[];
  noEMScaling: number[];
  noShiftingScaling: number[];
  blacklist: number[];
};

let fights: Fight[] = [];
const enemyTracker = new Map<number, number>();

const EventNormalizer = () => {
  const [wclTableContent, setWclTableContent] = useState<JSX.Element | null>(
    null
  );
  const [intervalsContent, setIntervalsContent] = useState<JSX.Element | null>(
    null
  );
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
    deathCountFilter,
  } = useAppSelector((state) => state.customFightParameters);
  const { isFetching } = useAppSelector((state) => state.status);
  const dispatch = useAppDispatch();

  useEffect(() => {
    enemyTracker.clear();

    if (WCLReport && WCLReport.masterData && WCLReport.masterData.actors) {
      WCLReport.masterData.actors
        .filter((actor) => actor.type === "NPC")
        .forEach((actor) => {
          enemyTracker.set(actor.id, actor.gameID ?? -1);
        });
    }
  }, [WCLReport, dispatch]);

  useEffect(() => {
    setRefreshData(true);
  }, [abilityNoEMScaling, abilityNoScaling, abilityNoShiftingScaling]);

  const handleButtonClick = async (getCSV: boolean) => {
    if (selectedFights.length === 0) {
      alert("No fight selected!");
      return;
    }
    if (parameterError) {
      alert(parameterErrorMsg);
      return;
    }

    dispatch(setIsFetching(true));
    setWclTableContent(
      <>
        <big>Fetching data</big>
        <br />
        <img src={bearDancing} />
      </>
    );
    setIntervalsContent(null);

    /* try { */
    await attemptNormalize(getCSV);
    /* } catch (error) {
      //setWclTableContent(<>{error}</>);
    } */

    dispatch(setIsFetching(false));
  };

  async function attemptNormalize(getCSV: boolean) {
    if (!WCLReport?.fights) {
      throw new Error("No fight report found");
    }

    const abilityFilters: AbilityFilters = {
      noScaling: abilityNoScaling.split(",").map(Number),
      noEMScaling: abilityNoEMScaling.split(",").map(Number),
      noShiftingScaling: abilityNoShiftingScaling.split(",").map(Number),
      blacklist: abilityBlacklist.split(",").map(Number),
    };

    try {
      fights = await generateFights(
        WCLReport,
        selectedFights,
        WCLReport.fights,
        fights,
        abilityFilters,
        refreshData,
        getCSV
      );

      const fightsToRender = fights.filter(
        (fight) =>
          selectedFights.includes(fight.fightId) &&
          fight.reportCode === WCLReport.code
      );

      const wclTableContent = tableRenderer(
        fightsToRender,
        enemyTracker,
        abilityBlacklist.split(",").map(Number),
        enemyBlacklist,
        Number(deathCountFilter)
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
        fightsToRender,
        selectedFights,
        WCLReport.code,
        formattedTimeSkipIntervals,
        enemyTracker,
        abilityNoEMScaling.split(",").map(Number),
        abilityNoScaling.split(",").map(Number),
        ebonMightWeight,
        intervalTimer,
        abilityBlacklist.split(",").map(Number),
        enemyBlacklist,
        Number(deathCountFilter)
      );

      const combinedCombatants: Combatant[] = [];

      fightsToRender.forEach((fight) => {
        const combatants = fight.combatants;

        combatants.forEach((combatant) => {
          const isUnique = !combinedCombatants.some(
            (unique) => unique.id === combatant.id
          );

          if (isUnique) {
            combinedCombatants.push(combatant);
          }
        });
      });

      const intervalContent = intervalRenderer(intervals, combinedCombatants);

      setWclTableContent(wclTableContent);
      setIntervalsContent(intervalContent);
      setRefreshData(false);
    } catch (error) {
      setWclTableContent(<>{error}</>);
    }
    dispatch(setIsFetching(false));
  }

  return (
    <div className="flex gap column pad">
      {parameterError && (
        <ErrorBear
          error={ReportParseError.INVALID_FILTER}
          customMsg={parameterErrorMsg}
        />
      )}
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
