import React, { useState } from "react";

type CustomFightParametersProps = {
  onFightParameterChange: (fightCustomParameters: FightParameters) => void;
};

export type TimeIntervals = {
  start: string;
  end: string;
};

export type FightParameters = {
  timeIntervals: TimeIntervals[];
};

const CustomFightParameters: React.FC<CustomFightParametersProps> = ({
  onFightParameterChange,
}) => {
  const [timeIntervals, setTimeIntervals] = useState([{ start: "", end: "" }]);
  const [customBlacklist, setCustomBlacklist] = useState("");

  const addTimeInterval = () => {
    setTimeIntervals([...timeIntervals, { start: "", end: "" }]);
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
        <p>Time intervals to skip.</p>
        {timeIntervals.map((interval, index) => (
          <div className="time-intervals-content" key={index}>
            <input
              placeholder="Start"
              value={interval.start}
              onChange={(e) =>
                handleInputChange(index, "start", e.target.value)
              }
            />
            -
            <input
              placeholder="End"
              value={interval.end}
              onChange={(e) => handleInputChange(index, "end", e.target.value)}
            />
          </div>
        ))}
        <button onClick={addTimeInterval}>Add period</button>
      </div>
      <div className="blacklist-container">
        <p>Custom Blacklist</p>
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
