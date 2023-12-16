import { useEffect, useState } from "react";
import { REDIRECT_URL, WCL_CLIENT_ID } from "../../util/constants";
import { hasValidWCLAuthentication, setWCLAuthentication } from "./auth";
import { useAppDispatch } from "../../redux/hooks";
import { setHasAuth } from "../../redux/slices/statusSlice";
import { ReportParseError } from "./parseWCLUrl";
import ErrorBear from "../../components/generic/ErrorBear";

export const HandleUserAuthorization = () => {
  const dispatch = useAppDispatch();
  const [errorBear, setErrorBear] = useState<ReportParseError | undefined>();

  const handleAuthorization = () => {
    window.location.href = `https://www.warcraftlogs.com/oauth/authorize?client_id=${WCL_CLIENT_ID}&state=XephIsCute&redirect_uri=${REDIRECT_URL}&response_type=code`;
  };

  useEffect(() => {
    const fetchCode = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");

      if (code && state === "XephIsCute") {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        const result = await setWCLAuthentication(code);
        if (result) {
          dispatch(setHasAuth(hasValidWCLAuthentication()));
          setErrorBear(undefined);
        } else {
          setErrorBear(ReportParseError.FAILED_AUTH);
        }
      }
    };

    fetchCode();
  }, [dispatch]);

  return (
    <>
      <div style={{ marginTop: "30px" }}>
        {errorBear && <ErrorBear error={errorBear} />}
        <big>
          For this site to work you need to allow use of your WCL Authorization,
          this eg. makes it possible to analyze your private logs.
          <br />
          None of this information is stored outside of your local storage.
        </big>
      </div>
      <button onClick={handleAuthorization}>Get WCL Auth</button>
      <button
        onClick={() => {
          localStorage.removeItem("wcl_access_token");
          localStorage.removeItem("wcl_token_expires_in");
          dispatch(setHasAuth(false));
        }}
      >
        Clear token
      </button>
    </>
  );
};
