import { useAppDispatch, useAppSelecter } from "../../redux/hooks";
import { modifyEnemyBlacklist } from "../../redux/slices/customFightParametersSlice";
import { AberrusEnemies, EncounterNames } from "../../util/EnemyTable";
import PopupContent from "../generic/PopupContent";
import "./fightParameterStyling.scss";

const EnemyFilter: React.FC = () => {
  const dispatch = useAppDispatch();
  const enemyBlacklist = useAppSelecter(
    (state) => state.customFightParameters.enemyBlacklist
  );

  const content = Object.entries(AberrusEnemies).map(([encounter, enemies]) => {
    return (
      <div key={encounter} className="flex container">
        <div className="flex title">
          <big>{EncounterNames[encounter]}</big>
        </div>
        <div className="flex enemies">
          {enemies.map((enemy) => {
            return (
              <label key={enemy.id} className="enemy">
                <input
                  type="checkbox"
                  checked={enemyBlacklist.includes(enemy.id)}
                  onChange={(e) =>
                    dispatch(
                      modifyEnemyBlacklist({
                        value: enemy.id,
                        add: e.target.checked,
                      })
                    )
                  }
                />
                {enemy.name}
              </label>
            );
          })}
        </div>
      </div>
    );
  });
  return <PopupContent content={content} name={"Enemy Filter"} />;
};

export default EnemyFilter;
