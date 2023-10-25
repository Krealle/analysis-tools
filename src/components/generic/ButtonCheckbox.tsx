import "./genericStyling.scss";

type ButtonCheckboxProps = {
  onClick: () => void;
  selected: boolean;
  flavorText?: string;
  title?: string;
  id?: string;
};

export const ButtonCheckbox: React.FC<ButtonCheckboxProps> = ({
  onClick,
  selected,
  flavorText,
  title,
  id,
}) => {
  return (
    <div
      className={`buttonCheckbox flex ${selected ? "selected" : ""}`}
      onClick={() => onClick()}
      id={id}
    >
      <div>
        <span className="title">{title}</span>
        {flavorText && (
          <>
            <br />
            <span className="flavorText">{flavorText}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ButtonCheckbox;
