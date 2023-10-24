import { useAppDispatch, useAppSelecter } from "../redux/hooks";
import { setShowOptions } from "../redux/slices/customFightParametersSlice";

type FightButtonProps = {
  isFetching: boolean;
  handleButtonClick: React.MouseEventHandler<HTMLButtonElement>;
};

const FightButtons: React.FC<FightButtonProps> = ({
  isFetching,
  handleButtonClick,
}) => {
  const dispatch = useAppDispatch();
  const showOptions = useAppSelecter(
    (state) => state.customFightParameters.showOptions
  );
  const { parameterError, parameterErrorMsg } = useAppSelecter(
    (state) => state.customFightParameters
  );

  return (
    <div className="pumpers-content">
      <button onClick={handleButtonClick} disabled={isFetching || showOptions}>
        Get Pumpers
      </button>
      <button
        onClick={() => dispatch(setShowOptions(!showOptions))}
        disabled={isFetching || parameterError}
      >
        {showOptions
          ? parameterError
            ? parameterErrorMsg
            : "Hide options"
          : "Show options"}
      </button>
    </div>
  );
};

export default FightButtons;
