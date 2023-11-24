import { useAppSelector } from "../redux/hooks";
import { ReportParseError } from "../wcl/util/parseWCLUrl";
import ErrorBear from "./generic/ErrorBear";

type FightButtonProps = {
  isFetching: boolean;
  handleButtonClick: (getCSV: boolean) => Promise<void>;
};

const FightButtons: React.FC<FightButtonProps> = ({
  isFetching,
  handleButtonClick,
}) => {
  const { parameterError, parameterErrorMsg } = useAppSelector(
    (state) => state.customFightParameters
  );

  return (
    <div className="pumpers-content">
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
      {parameterError && (
        <ErrorBear
          error={ReportParseError.INVALID_FILTER}
          customMsg={parameterErrorMsg}
        />
      )}
    </div>
  );
};

export default FightButtons;
