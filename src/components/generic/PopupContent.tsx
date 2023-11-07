import React, { useState } from "react";
import "./genericStyling.scss";

interface PopupProps {
  content: React.ReactNode;
  name: string;
  disabled?: boolean;
}

const PopupContent: React.FC<PopupProps> = ({ content, name, disabled }) => {
  const [isPopupOpen, setPopupOpen] = useState(false);

  return (
    <>
      <button onClick={() => setPopupOpen(true)} disabled={disabled}>
        {name}
      </button>
      {isPopupOpen && (
        <div className="popup-overlay flex">
          <div className="popup-content">
            <button
              onClick={() => setPopupOpen(false)}
              className="close-button"
            >
              X
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default PopupContent;
