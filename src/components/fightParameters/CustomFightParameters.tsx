import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelecter } from "../../redux/hooks";
import {
  setTimeSkipIntervals,
  setParameterErrorMsg,
  setParameterError,
} from "../../redux/slices/customFightParametersSlice";
import { formatTime } from "../../util/format";
import { TimeSkipIntervals } from "../../helpers/types";
import EnemyFilter from "./EnemyFilter";
import AbilityFilter from "./AbilityFilter";

const CustomFightParameters = () => {
  const [timeIntervals, setTimeIntervals] = useState<
    { start: string; end: string }[]
  >([]);

  const dispatch = useAppDispatch();
  const { showOptions } = useAppSelecter(
    (state) => state.customFightParameters
  );

  const addTimeInterval = () => {
    setTimeIntervals([...timeIntervals, { start: "", end: "" }]);
  };

  const removeTimeInterval = (index: number) => {
    const updatedIntervals = [...timeIntervals];
    updatedIntervals.splice(index, 1);
    setTimeIntervals(updatedIntervals);
  };

  const handleInputChange = (
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const updatedIntervals = [...timeIntervals];
    updatedIntervals[index][field] = value;
    setTimeIntervals(updatedIntervals);
  };

  const {
    abilityBlacklist,
    abilityNoBoEScaling,
    abilityNoEMScaling,
    abilityNoScaling,
  } = useAppSelecter((state) => state.customFightParameters);

  useEffect(() => {
    const formatedIntervals: TimeSkipIntervals[] = [];
    for (const interval of timeIntervals) {
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
      formatedIntervals.push({
        start: formatedStartTime,
        end: formatedEndTime,
      });
    }
    dispatch(setTimeSkipIntervals(formatedIntervals));

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
    timeIntervals,
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
      <div className="time-intervals-container">
        <p>Time intervals to skip</p>
        {timeIntervals.map((interval, index) => (
          <div className="time-intervals-content" key={index}>
            <button onClick={() => removeTimeInterval(index)}>X</button>
            <input
              placeholder="0:45"
              value={interval.start}
              onChange={(e) =>
                handleInputChange(index, "start", e.target.value)
              }
            />{" "}
            -{" "}
            <input
              placeholder="1:05"
              value={interval.end}
              onChange={(e) => handleInputChange(index, "end", e.target.value)}
            />
          </div>
        ))}
        <button onClick={addTimeInterval}>Add period</button>
      </div>
      <AbilityFilter />
      <EnemyFilter />
    </div>
  );
};

export default CustomFightParameters;
