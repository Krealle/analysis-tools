import { useEffect } from "react";
import { useAppDispatch, useAppSelecter } from "../../redux/hooks";
import {
  setParameterErrorMsg,
  setParameterError,
} from "../../redux/slices/customFightParametersSlice";
import { formatTime } from "../../util/format";
import EnemyFilter from "./EnemyFilter";
import AbilityFilter from "./AbilityFilter";
import TimePeriodFilter from "./TimePeriodFilter";

const CustomFightParameters = () => {
  const dispatch = useAppDispatch();
  const {
    showOptions,
    abilityBlacklist,
    abilityNoBoEScaling,
    abilityNoEMScaling,
    abilityNoScaling,
    timeSkipIntervals,
  } = useAppSelecter((state) => state.customFightParameters);

  useEffect(() => {
    for (const interval of timeSkipIntervals) {
      const formatedStartTime = formatTime(interval.start);
      const formatedEndTime = formatTime(interval.end);
      if (
        !formatedStartTime ||
        !formatedEndTime ||
        formatedStartTime > formatedEndTime
      ) {
        dispatch(setParameterErrorMsg("Invalid time interval"));
        dispatch(setParameterError(true));
        return;
      }
    }

    /** In my eyes this is black magic but all
     * it does is check if blacklist format is correct:
     * eg. "23,25,25" / "24, 255, 23478" */
    const regex = /^(\s*\d+\s*,\s*)*\s*\d+\s*$/;
    const abilityFilterValid =
      regex.test(abilityBlacklist) &&
      regex.test(abilityNoBoEScaling) &&
      regex.test(abilityNoEMScaling) &&
      regex.test(abilityNoScaling);
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
    dispatch,
  ]);

  return (
    <div
      className={`pumpers-content ${
        showOptions
          ? "custom-fight-parameters"
          : "custom-fight-parameters-hidden"
      }`}
    >
      <TimePeriodFilter />
      <AbilityFilter />
      <EnemyFilter />
    </div>
  );
};

export default CustomFightParameters;
