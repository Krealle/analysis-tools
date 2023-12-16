import { ChangeEvent, FormEvent, useState } from "react";
import { getFights } from "../wcl/util/queryWCL";
import { ReportParseError, parseWCLUrl } from "../wcl/util/parseWCLUrl";
import ErrorBear from "./generic/ErrorBear";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setFightReport } from "../redux/slices/WCLUrlInputSlice";
import { setSelectedIds } from "../redux/slices/fightBoxesSlice";
import "../styles/WCLUrlInput.scss";
import { HandleUserAuthorization } from "../wcl/util/UserAuthorization";

export const WCLUrlInput = () => {
  const [url, setUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorBear, setErrorBear] = useState<ReportParseError | undefined>();

  const dispatch = useAppDispatch();
  const WCLReport = useAppSelector((state) => state.WCLUrlInput.fightReport);
  const hasAuth = useAppSelector((state) => state.status.hasAuth);

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
      <form onSubmit={handleSubmit} className="flex">
        <div className="flex">
          <div>
            <input
              type="text"
              placeholder="Enter WCL URL"
              className="wclUrlInput"
              value={url}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !hasAuth}
            className="wclUrlButton"
          >
            {isSubmitting ? "Fetching..." : "Fetch Fights"}
          </button>
        </div>
      </form>
      {!hasAuth && <HandleUserAuthorization />}
      {errorBear && <ErrorBear error={errorBear} />}
    </>
  );
};
