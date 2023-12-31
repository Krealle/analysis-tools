import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  setParameterErrorMsg,
  setParameterError,
} from "../../redux/slices/customFightParametersSlice";
import { formatTime } from "../../util/format";
import EnemyFilter from "./EnemyFilter";
import AbilityFilter from "./AbilityFilter";
import TimePeriodFilter from "./TimePeriodFilter";
import IntervalSettings from "./IntervalSettings";
import DeathFilter from "./DeathFilter";

const CustomFightParameters = () => {
  const dispatch = useAppDispatch();
  const {
    abilityBlacklist,
    abilityNoBoEScaling,
    abilityNoEMScaling,
    abilityNoScaling,
    abilityNoShiftingScaling,
    timeSkipIntervals,
  } = useAppSelector((state) => state.customFightParameters);

  useEffect(() => {
    for (const interval of timeSkipIntervals) {
      const formattedStartTime = formatTime(interval.start);
      const formattedEndTime = formatTime(interval.end);
      if (
        !formattedStartTime ||
        !formattedEndTime ||
        formattedStartTime > formattedEndTime
      ) {
        dispatch(setParameterErrorMsg("Invalid time interval"));
        dispatch(setParameterError(true));
        return;
      }
    }

    /** In my eyes this is black magic but all
     * it does is check if blacklist format is correct:
     * eg. "23,25,25" / "24, 255, 23478" */
    const regex = /^(\s*\d+\s*,\s*)*\s*\d*\s*$/;
    const abilityFilterValid =
      regex.test(abilityBlacklist) &&
      regex.test(abilityNoBoEScaling) &&
      regex.test(abilityNoEMScaling) &&
      regex.test(abilityNoScaling) &&
      regex.test(abilityNoShiftingScaling);
    if (!abilityFilterValid) {
      dispatch(setParameterErrorMsg("Invalid ability filter"));
      dispatch(setParameterError(true));
      return;
    }

    dispatch(setParameterErrorMsg(""));
    dispatch(setParameterError(false));
  }, [
    abilityBlacklist,
    abilityNoBoEScaling,
    abilityNoEMScaling,
    abilityNoScaling,
    timeSkipIntervals,
    abilityNoShiftingScaling,
    dispatch,
  ]);

  return (
    <div className={`flex gap`}>
      <TimePeriodFilter />
      <AbilityFilter />
      <EnemyFilter />
      <IntervalSettings />
      <DeathFilter />
    </div>
  );
};

export default CustomFightParameters;
