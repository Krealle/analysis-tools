import React from "react";
import {
  FetchStatus,
  fetchStatusIconMap,
  fetchStatusMap,
} from "../../util/constants";

type FetchingStatusProps = {
  status?: FetchStatus;
  customMsg?: string;
};

const FetchingStatus: React.FC<FetchingStatusProps> = ({
  status,
  customMsg,
}) => {
  if (!status) return <></>;
  return (
    <div /*  className="error-bear-container" */>
      <big>{customMsg ? customMsg : fetchStatusMap[status]}</big>
      <br />
      <img
        src={fetchStatusIconMap[status]}
        loading="lazy"
        width="256"
        height="256"
        alt="we do be fetching"
      />
    </div>
  );
};

export default FetchingStatus;
