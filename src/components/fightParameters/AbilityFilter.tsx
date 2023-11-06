import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  setAbilityBlacklist,
  setAbilityNoShiftingScaling,
  setAbilityNoBoEScaling,
  setAbilityNoEMScaling,
  setAbilityNoScaling,
} from "../../redux/slices/customFightParametersSlice";
import PopupContent from "../generic/PopupContent";
import "./fightParameterStyling.scss";

const AbilityFilter: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    abilityNoEMScaling,
    abilityNoBoEScaling,
    abilityNoScaling,
    abilityBlacklist,
    abilityNoShiftingScaling,
  } = useAppSelector((state) => state.customFightParameters);

  const content = (
    <div className="flex">
      <div className="flex container">
        <div className="flex title">
          <big>No EM Scaling</big>
        </div>
        <div className="flex abilities">
          <textarea
            onChange={(e) => dispatch(setAbilityNoEMScaling(e.target.value))}
            value={abilityNoEMScaling}
            className="mrtNoteTextbox"
          />
        </div>
      </div>
      {/* <div className="flex container">
        <div className="flex title">
          <big>No BoE Scaling (-10%)</big>
        </div>
        <div className="flex abilities">
          <textarea
            onChange={(e) => dispatch(setAbilityNoBoEScaling(e.target.value))}
            value={abilityNoBoEScaling}
            className="mrtNoteTextbox"
          />
        </div>
      </div> */}
      <div className="flex container">
        <div className="flex title">
          <big>No Shifting Sands Scaling</big>
        </div>
        <div className="flex abilities">
          <textarea
            onChange={(e) =>
              dispatch(setAbilityNoShiftingScaling(e.target.value))
            }
            value={abilityNoShiftingScaling}
            className="mrtNoteTextbox"
          />
        </div>
      </div>
      <div className="flex container">
        <div className="flex title">
          <big>No Scaling</big>
        </div>
        <div className="flex abilities">
          <textarea
            onChange={(e) => dispatch(setAbilityNoScaling(e.target.value))}
            value={abilityNoScaling}
            className="mrtNoteTextbox"
          />
        </div>
      </div>
      <div className="flex container">
        <div className="flex title">
          <big>Blacklist</big>
        </div>
        <div className="flex abilities">
          <textarea
            onChange={(e) => dispatch(setAbilityBlacklist(e.target.value))}
            value={abilityBlacklist}
            className="mrtNoteTextbox"
          />
        </div>
      </div>
    </div>
  );

  return <PopupContent content={content} name={"Ability Filter"} />;
};

export default AbilityFilter;
