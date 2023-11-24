import { ChangeEvent, FormEvent, useState } from "react";
import { getFights } from "../wcl/util/queryWCL";
import { ReportParseError, parseWCLUrl } from "../wcl/util/parseWCLUrl";
import ErrorBear from "./generic/ErrorBear";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setFightReport } from "../redux/slices/WCLUrlInputSlice";
import { setSelectedIds } from "../redux/slices/fightBoxesSlice";

export const WCLUrlInput = () => {
  const [url, setUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorBear, setErrorBear] = useState<ReportParseError | undefined>();

  const dispatch = useAppDispatch();
  const WCLReport = useAppSelector((state) => state.WCLUrlInput.fightReport);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const { reportCode, error } = parseWCLUrl(url);
    if (!reportCode || error) {
      if (error) {
        setErrorBear(error);
      }
      return;
    }
    setErrorBear(undefined);

    setIsSubmitting(true);

    try {
      const newFightReport = await getFights({ reportID: reportCode });

      if (newFightReport?.code !== WCLReport?.code) {
        dispatch(setSelectedIds([]));
      }

      dispatch(setFightReport(newFightReport));
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
