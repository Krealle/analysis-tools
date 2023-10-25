import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  addTimeSkipInterval,
  changeTimeSkipInterval,
  removeTimeSkipInterval,
} from "../../redux/slices/customFightParametersSlice";
import PopupContent from "../generic/PopupContent";

const TimePeriodFilter: React.FC = () => {
  const timeIntervals = useAppSelector(
    (state) => state.customFightParameters.timeSkipIntervals
  );
  const dispatch = useAppDispatch();

  const content = (
    <div className="time-intervals-container">
      <p>Time intervals to skip</p>
      {timeIntervals.map((interval, index) => (
        <div className="time-intervals-content" key={index}>
          <button
            key={index}
            onClick={() => dispatch(removeTimeSkipInterval(index))}
          >
            X
          </button>
          <input
            placeholder="0:45"
            value={interval.start}
            onChange={(e) =>
              dispatch(
                changeTimeSkipInterval({
                  index: index,
                  entry: "start",
                  value: e.target.value,
                })
              )
            }
          />{" "}
          -{" "}
          <input
            placeholder="1:05"
            value={interval.end}
            onChange={(e) =>
              dispatch(
                changeTimeSkipInterval({
                  index: index,
                  entry: "end",
                  value: e.target.value,
                })
              )
            }
          />
        </div>
      ))}
      <button
        onClick={() => dispatch(addTimeSkipInterval({ start: "", end: "" }))}
      >
        Add period
      </button>
    </div>
  );

  return <PopupContent content={content} name={"Time Filter"} />;
};

export default TimePeriodFilter;
