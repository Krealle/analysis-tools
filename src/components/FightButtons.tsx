import { useAppSelector } from "../redux/hooks";

type FightButtonProps = {
  isFetching: boolean;
  handleButtonClick: (getCSV: boolean) => Promise<void>;
};

const FightButtons: React.FC<FightButtonProps> = ({
  isFetching,
  handleButtonClick,
}) => {
  const { parameterError } = useAppSelector(
    (state) => state.customFightParameters
  );

  return (
    <div className="flex gap">
      <button
        onClick={() => handleButtonClick(false)}
        disabled={isFetching || parameterError}
      >
        Get Pumpers
      </button>
      <button
        onClick={() => handleButtonClick(true)}
        disabled={isFetching || parameterError}
      >
        Get Pumpers + sus events
      </button>
    </div>
  );
};

export default FightButtons;
