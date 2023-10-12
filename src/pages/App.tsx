import "../styles/App.scss";
import { useEffect, useState } from "react";
import { setWCLAuthentication } from "../wcl/util/auth";
import { GetFights, GetMetaData } from "../components/GetFights";
import React from "react";
import GetTopPumpers from "../components/GetTopPumpers";
import { Report } from "../wcl/gql/types";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [checkboxes, setCheckboxes] = useState<JSX.Element[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [reportCode, setReportCodeValue] = useState("");
  const [metaData, setMetaData] = useState<Report | undefined>();

  const handleCheckboxClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkboxId = parseFloat(e.target.value);
    setSelectedIds((prevIds) =>
      e.target.checked
        ? [...prevIds, checkboxId]
        : prevIds.filter((id) => id !== checkboxId)
    );
  };

  useEffect(() => {
    const fetchFights = async () => {
      if (inputValue.trim() === "") {
        setCheckboxes(null);
        return;
      }

      const url = new URL(inputValue);

      const reportCode = url.pathname.split("/").pop() ?? "";

      //console.log("Code from url:", reportCode);
      setReportCodeValue(reportCode);

      const fightBoxes = await GetFights(reportCode);
      const metaData = await GetMetaData(reportCode);
      setCheckboxes(fightBoxes);
      setMetaData(metaData);
    };

    fetchFights();
  }, [inputValue]);

  return (
    <>
      <h1>WCL URL</h1>
      <input
        className="url-input"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter a value"
      />

      {checkboxes && (
        <div className="checkbox-container">
          <h2>Checkboxes for Fights with Difficulty</h2>
          {React.Children.map(checkboxes, (checkbox) =>
            React.cloneElement(checkbox, {
              onClick: handleCheckboxClick,
            })
          )}
          <GetTopPumpers
            selectedFights={selectedIds}
            reportCode={reportCode}
            metaData={metaData}
          />
        </div>
      )}

      <div className="card">
        <button onClick={setWCLAuthentication}>Force new token</button>
      </div>
    </>
  );
}

export default App;
