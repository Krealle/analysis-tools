import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { modifyEnemyBlacklist } from "../../redux/slices/customFightParametersSlice";
import {
  AmirdrassilEnemies,
  EncounterImages,
  EncounterNames,
} from "../../util/enemyTables";
import ButtonCheckbox from "../generic/ButtonCheckbox";
import PopupContent from "../generic/PopupContent";
import "./fightParameterStyling.scss";

const EnemyFilter: React.FC = () => {
  const dispatch = useAppDispatch();
  const enemyBlacklist = useAppSelector(
    (state) => state.customFightParameters.enemyBlacklist
  );
  const { isFetching } = useAppSelector((state) => state.status);

  const content = Object.entries(AmirdrassilEnemies).map(
    ([encounter, enemies]) => {
      return (
        <div key={encounter} className="flex container">
          <div className="flex title">
            <img src={EncounterImages[encounter]} />
            <p>{EncounterNames[encounter]}</p>
          </div>
          <div className="flex enemies">
            {enemies.map((enemy) => {
              return (
                <ButtonCheckbox
                  key={enemy.id}
                  id="enemy"
                  title={enemy.name}
                  onClick={() =>
                    dispatch(
                      modifyEnemyBlacklist({
                        value: enemy.id,
                        add: !enemyBlacklist.includes(enemy.id),
                      })
                    )
                  }
                  selected={enemyBlacklist.includes(enemy.id)}
                />
              );
            })}
          </div>
        </div>
      );
    }
  );
  return (
    <PopupContent
      content={content}
      name={"Enemy Filter"}
      disabled={isFetching}
    />
  );
};

export default EnemyFilter;
