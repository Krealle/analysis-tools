import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  setIntervalTimer,
  setEbonMightWeight,
} from "../../redux/slices/customFightParametersSlice";
import PopupContent from "../generic/PopupContent";
import "./fightParameterStyling.scss";

const IntervalSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { intervalTimer, ebonMightWeight } = useAppSelector(
    (state) => state.customFightParameters
  );

  const intervals: number[] = Array.from(
    { length: 60 },
    (_, index) => index + 1
  );
  const weights: number[] = Array.from(
    { length: 101 },
    (_, index) => index / 100
  );

  const content = (
    <div className="flex">
      <div className="flex container">
        <div className="flex title">
          <big>Interval Timer</big>
        </div>
        <div className="flex abilities">
          <select
            onChange={(e) =>
              dispatch(setIntervalTimer(parseInt(e.target.value, 10)))
            }
            value={intervalTimer}
          >
            {intervals.map((number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex container">
        <div className="flex title">
          <big>Ebon Might Weight</big>
        </div>
        <div className="flex abilities">
          <select
            onChange={(e) =>
              dispatch(setEbonMightWeight(parseInt(e.target.value, 10)))
            }
            value={ebonMightWeight}
          >
            {weights.map((number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return <PopupContent content={content} name={"Interval Settings"} />;
};

export default IntervalSettings;
