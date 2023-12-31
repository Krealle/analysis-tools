import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import FightButtons from "../FightButtons";
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
import { FightDataSet, fetchFightData } from "./util/fetchFightData";
import { Fight, handleFightData } from "./util/handleFightData";
import FetchingStatus from "../generic/FetchingStatus";
import { FetchStatus } from "../../util/constants";

export type AbilityFilters = {
  noScaling: number[];
  noEMScaling: number[];
  noShiftingScaling: number[];
  blacklist: number[];
};

const fights: Fight[] = [];
const fetchedFightDataSets: FightDataSet[] = [];
const enemyTracker = new Map<number, number>();

const EventNormalizer = () => {
  const [wclTableContent, setWclTableContent] = useState<JSX.Element | null>(
    null
  );
  const [intervalsContent, setIntervalsContent] = useState<JSX.Element | null>(
    null
  );
  const [fetchStatus, setFetchStatus] = useState<FetchStatus | undefined>();

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
    // TODO: This should be revisited, but in general it should be fine
    fights.splice(0, fights.length);
  }, [abilityNoEMScaling, abilityNoScaling, abilityNoShiftingScaling]);

  const attemptNormalize = async () => {
    if (selectedFights.length === 0) {
      alert("No fight selected!");
      return;
    }
    if (parameterError) {
      alert(parameterErrorMsg);
      return;
    }
    if (!WCLReport?.fights) {
      throw new Error("No fight report found");
    }

    dispatch(setIsFetching(true));
    setFetchStatus(FetchStatus.FETCHING);

    const abilityFilters: AbilityFilters = {
      noScaling: abilityNoScaling.split(",").map(Number),
      noEMScaling: abilityNoEMScaling.split(",").map(Number),
      noShiftingScaling: abilityNoShiftingScaling.split(",").map(Number),
      blacklist: abilityBlacklist.split(",").map(Number),
    };

    const fightsToFetch = selectedFights.filter(
      (id) => !fetchedFightDataSets.map((f) => f.fight.id).includes(id)
    );

    fetchFightData(WCLReport, fightsToFetch)
      .then(async (fightDataSets) => {
        setFetchStatus(FetchStatus.ANALYZING);
        fetchedFightDataSets.push(...fightDataSets);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        const fightsToHandle = fetchedFightDataSets.filter(
          (id) => !fights.map((f) => f.fightId).includes(id.fight.id)
        );

        const newFights = handleFightData(
          WCLReport,
          fightsToHandle,
          abilityFilters
        );

        fights.push(...newFights);

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
          abilityFilters,
          ebonMightWeight,
          intervalTimer,
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
        setFetchStatus(undefined);
        dispatch(setIsFetching(false));
      });
  };

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
        handleButtonClick={attemptNormalize}
      />
      <CustomFightParameters />
      {isFetching && <FetchingStatus status={fetchStatus} />}
      {!isFetching && wclTableContent}
      {!isFetching && intervalsContent}
    </div>
  );
};

export default EventNormalizer;
