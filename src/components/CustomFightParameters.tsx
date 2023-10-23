import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelecter } from "../redux/hooks";
import {
  setTimeSkipIntervals,
  setCustomBlacklist,
  setOnlyBossDamage,
  setParameterErrorMsg,
  setParameterError,
} from "../redux/slices/customFightParametersSlice";
import { formatTime } from "../util/format";
import { TimeSkipIntervals } from "../helpers/types";

const CustomFightParameters = () => {
  const [timeIntervals, setTimeIntervals] = useState<
    { start: string; end: string }[]
  >([]);

  const dispatch = useAppDispatch();
  const { customBlacklist, onlyBossDamage } = useAppSelecter(
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

  useEffect(() => {
    checkForErrorAndDispatch();
  }, [customBlacklist, timeIntervals]);

  const checkForErrorAndDispatch = () => {
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
    const blackListValid = regex.test(customBlacklist);
    if (!blackListValid && customBlacklist !== "") {
      dispatch(setParameterErrorMsg("Invalid blacklist"));
      dispatch(setParameterError(true));
      return;
    }

    dispatch(setParameterErrorMsg(""));
    dispatch(setParameterError(false));
  };

  return (
    <>
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
      <div className="blacklist-container">
        <p>Abilities to blacklist</p>
        <div className="blacklist-content">
          <input
            type="text"
            placeholder="2975,1560,23"
            value={customBlacklist}
            onChange={(e) => dispatch(setCustomBlacklist(e.target.value))}
          />
        </div>
      </div>
      <div className="blacklist-container">
        <p>Mob blacklist</p>
        <div
          className={`only-boss-damage ${onlyBossDamage ? "selected" : ""}`}
          onClick={() => dispatch(setOnlyBossDamage(!onlyBossDamage))}
        >
          <span>Only Boss Damage</span>
        </div>
      </div>
    </>
  );
};

export default CustomFightParameters;
