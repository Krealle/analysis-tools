import "./genericStyling.scss";

type ButtonCheckboxProps = {
  onClick: () => void;
  selected: boolean;
  flavorText?: string;
  title?: string;
  id?: string;
  disabled?: boolean;
};

export const ButtonCheckbox: React.FC<ButtonCheckboxProps> = ({
  onClick,
  selected,
  flavorText,
  title,
  id,
  disabled,
}) => {
  return (
    <div
      className={`buttonCheckbox flex ${selected ? "selected" : ""}`}
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
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
