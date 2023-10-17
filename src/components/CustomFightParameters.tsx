import React from "react";
import { FightParameters } from "../helpers/types";

type CustomFightParametersProps = {
  onFightParameterChange: (fightCustomParameters: FightParameters) => void;
  timeIntervals: { start: string; end: string }[];
  customBlacklist: string;
  setTimeIntervals: (intervals: { start: string; end: string }[]) => void;
  setCustomBlacklist: (blacklist: string) => void;
};

const CustomFightParameters: React.FC<CustomFightParametersProps> = ({
  onFightParameterChange,
  timeIntervals,
  customBlacklist,
  setTimeIntervals,
  setCustomBlacklist,
}) => {
  const addTimeInterval = () => {
    setTimeIntervals([...timeIntervals, { start: "", end: "" }]);
  };

  const removeTimeInterval = (index: number) => {
    const updatedIntervals = [...timeIntervals];
    updatedIntervals.splice(index, 1);
    setTimeIntervals(updatedIntervals);
    onFightParameterChange({ timeIntervals: updatedIntervals });
  };

  const handleInputChange = (
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const updatedIntervals = [...timeIntervals];
    updatedIntervals[index][field] = value;
    setTimeIntervals(updatedIntervals);
    onFightParameterChange({ timeIntervals: updatedIntervals });
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
            onChange={(e) => setCustomBlacklist(e.target.value)}
          />
        </div>
      </div>
    </>
  );
};

export default CustomFightParameters;
