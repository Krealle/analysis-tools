import React, { useState } from "react";
import "./genericStyling.scss";

interface PopupProps {
  content: React.ReactNode;
  name: string;
}

const PopupContent: React.FC<PopupProps> = ({ content, name }) => {
  const [isPopupOpen, setPopupOpen] = useState(false);

  return (
    <>
      <button onClick={() => setPopupOpen(true)}>{name}</button>
      {isPopupOpen && (
        <div className="popup-overlay">
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
