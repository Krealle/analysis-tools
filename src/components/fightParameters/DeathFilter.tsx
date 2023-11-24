import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setDeathCountFilter } from "../../redux/slices/customFightParametersSlice";
import "./fightParameterStyling.scss";

const DeathFilter: React.FC = () => {
  const dispatch = useAppDispatch();
  const { deathCountFilter } = useAppSelector(
    (state) => state.customFightParameters
  );
  const { isFetching } = useAppSelector((state) => state.status);

  const content = (
    <div className="flex">
      <div className="flex container">
        <div className="flex">
          Ignore Events After Player Deaths:
          <input
            onChange={(e) => dispatch(setDeathCountFilter(e.target.value))}
            value={deathCountFilter}
            disabled={isFetching}
            className="deathFilterInput"
          />
        </div>
      </div>
    </div>
  );

  return content;
};

export default DeathFilter;
