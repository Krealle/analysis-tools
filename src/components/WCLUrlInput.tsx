import { ChangeEvent, FormEvent, useState } from "react";
import { Report } from "../wcl/gql/types";
import { getFights } from "../wcl/util/queryWCL";
import { ReportParseError, parseWCLUrl } from "../wcl/util/parseWCLUrl";
import ErrorBear from "./ErrorBear";

interface WCLUrlInputProps {
  onFightChange: (newFightReport: Report | undefined) => void;
}

export const WCLUrlInput = ({ onFightChange }: WCLUrlInputProps) => {
  const [url, setUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorBear, setErrorBear] = useState<ReportParseError | undefined>();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const { reportCode, error } = parseWCLUrl(url);

    if (!reportCode || error) {
      if (error) {
        setErrorBear(error);
      } else {
        setErrorBear(undefined);
      }
      onFightChange(undefined);
      return;
    }

    setIsSubmitting(true);

    try {
      const newFightReport = await getFights({ reportID: reportCode });
      onFightChange(newFightReport);
    } catch (error) {
      // Handle errors here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="wcl-form-container">
        <div className="inner-container">
          <div className="input-container">
            <input
              type="text"
              placeholder="Enter WCL URL"
              value={url}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Fetching..." : "Fetch Fights"}
          </button>
        </div>
      </form>
      {errorBear && <ErrorBear error={errorBear} />}
    </>
  );
};
