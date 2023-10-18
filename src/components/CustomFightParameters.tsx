import React from "react";
import { FightParameters } from "../helpers/types";

type CustomFightParametersProps = {
  onFightParameterChange: (fightCustomParameters: FightParameters) => void;
  timeIntervals: { start: string; end: string }[];
  customBlacklist: string;
  onlyBossDamage: boolean;
  setTimeIntervals: (intervals: { start: string; end: string }[]) => void;
  setCustomBlacklist: (blacklist: string) => void;
  setOnlyBossDamage: (onlyBossDamage: boolean) => void;
};

const CustomFightParameters: React.FC<CustomFightParametersProps> = ({
  onFightParameterChange,
  timeIntervals,
  customBlacklist,
  onlyBossDamage,
  setTimeIntervals,
  setCustomBlacklist,
  setOnlyBossDamage,
}) => {
  const addTimeInterval = () => {
    setTimeIntervals([...timeIntervals, { start: "", end: "" }]);
  };

  const removeTimeInterval = (index: number) => {
    const updatedIntervals = [...timeIntervals];
    updatedIntervals.splice(index, 1);
    setTimeIntervals(updatedIntervals);
    onFightParameterChange({
      timeIntervals: updatedIntervals,
      customBlacklist,
    });
  };

  const handleInputChange = (
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const updatedIntervals = [...timeIntervals];
    updatedIntervals[index][field] = value;
    setTimeIntervals(updatedIntervals);
    onFightParameterChange({
      timeIntervals: updatedIntervals,
      customBlacklist,
    });
  };

  const handleBlacklistChange = (value: string) => {
    setCustomBlacklist(value);
    onFightParameterChange({ timeIntervals, customBlacklist: value });
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
            onChange={(e) => handleBlacklistChange(e.target.value)}
          />
        </div>
      </div>
      <div className="blacklist-container">
        <p>Mob blacklist</p>
        <div
          className={`only-boss-damage ${onlyBossDamage ? "selected" : ""}`}
          onClick={() => setOnlyBossDamage(!onlyBossDamage)}
        >
          <span>Only Boss Damage</span>
        </div>
      </div>
    </>
  );
};

export default CustomFightParameters;
