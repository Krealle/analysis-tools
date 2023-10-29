import React from "react";
import {
  ReportParseError,
  reportParseErrorIconMap,
  reportParseErrorMap,
} from "../../wcl/util/parseWCLUrl";

interface ErrorBearProps {
  error: ReportParseError;
  customMsg?: string;
}

const ErrorBear: React.FC<ErrorBearProps> = ({ error, customMsg }) => (
  <div className="error-bear-container">
    <img
      src={reportParseErrorIconMap[error]}
      loading="lazy"
      width="48"
      height="48"
      alt="An error occurred:"
    />
    <p>{customMsg ? customMsg : reportParseErrorMap[error]}</p>
  </div>
);

export default ErrorBear;
