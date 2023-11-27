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
        <b> Get DPS</b>
      </button>
      {/* <button
        onClick={() => handleButtonClick(true)}
        disabled={isFetching || parameterError}
      >
        <b> Get DPS + sus events</b>
      </button> */}
    </div>
  );
};

export default FightButtons;
