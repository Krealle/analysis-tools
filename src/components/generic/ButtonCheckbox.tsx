import "./genericStyling.scss";

type ButtonCheckboxProps = {
  onClick: () => void;
  selected: boolean;
  flavorText?: string;
  title?: string;
  id?: string;
  disabled?: boolean;
  content?: JSX.Element;
};

export const ButtonCheckbox: React.FC<ButtonCheckboxProps> = ({
  onClick,
  selected,
  flavorText,
  title,
  id,
  disabled,
  content,
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
      {title && <span className="title">{title}</span>}
      {flavorText && (
        <>
          <br />
          <span className="flavorText">{flavorText}</span>
        </>
      )}
      {content}
    </div>
  );
};

export default ButtonCheckbox;
