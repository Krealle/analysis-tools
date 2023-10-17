import React from "react";
import {
  ReportParseError,
  reportParseErrorIconMap,
  reportParseErrorMap,
} from "../wcl/util/parseWCLUrl";

interface ErrorBearProps {
  error: ReportParseError;
}

const ErrorBear: React.FC<ErrorBearProps> = ({ error }) => (
  <div className="error-bear-container">
    <img
      src={reportParseErrorIconMap[error]}
      loading="lazy"
      width="48"
      height="48"
      alt="An error occurred:"
    />
    <p>{reportParseErrorMap[error]}</p>
  </div>
);

export default ErrorBear;
