import "../styles/App.scss";
import { useEffect, useState } from "react";
import { setWCLAuthentication } from "../wcl/util/auth";
import { GetFights, GetMetaData } from "../components/GetFights";
import React from "react";
import GetTopPumpers from "../components/GetTopPumpers";
import { Report } from "../wcl/gql/types";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [metaData, setMetaData] = useState<Report | undefined>();
  const [checkBoxes, setCheckboxes] = useState<JSX.Element[] | null>(null);
  const [reportCode, setReportCodeValue] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [checkboxStates, setCheckboxStates] = useState<{
    [id: number]: boolean;
  }>({});

  console.log(selectedIds);
  const handleCheckboxClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkboxId = parseFloat(e.target.value);
    const newCheckboxStates = { ...checkboxStates };
    newCheckboxStates[checkboxId] = e.target.checked;
    setCheckboxStates(newCheckboxStates);

    setSelectedIds((prevIds) =>
      e.target.checked
        ? [...prevIds, checkboxId]
        : prevIds.filter((id) => id !== checkboxId)
    );
  };

  const fetchFights = async () => {
    if (inputValue.trim() === "") {
      setCheckboxes(null);
      return;
    }

    const url = new URL(inputValue);

    const reportCode = url.pathname.split("/").pop() ?? "";

    console.log("Code from url:", reportCode);
    setReportCodeValue(reportCode);

    const fightBoxes = await GetFights({
      code: reportCode,
      selectedIds: selectedIds,
      setSelectedIds: setSelectedIds,
    });
    const metaData = await GetMetaData(reportCode);

    // Initialize checkboxStates with the fetched checkboxes
    const initialCheckboxStates: { [id: number]: boolean } = {};
    fightBoxes?.forEach((checkbox) => {
      initialCheckboxStates[parseFloat(checkbox.props.value)] = false;
    });

    setCheckboxes(fightBoxes);
    setCheckboxStates(initialCheckboxStates);
    setMetaData(metaData);
  };

  useEffect(() => {
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

      {checkBoxes && (
        <>
          <h2>Select fights to analyze</h2>
          <div className="fights-button-container">
            <button onClick={setWCLAuthentication}>Force new token</button>
            <button onClick={() => fetchFights()}>Update fights</button>
            <button disabled>Select all fights</button>
            <button disabled>Select all kills</button>
          </div>
          <div className="fights-container">
            {React.Children.map(checkBoxes, (checkbox) =>
              React.cloneElement(checkbox, {
                onClick: handleCheckboxClick,
                checked:
                  checkboxStates[parseFloat(checkbox.props.value)] || false,
              })
            )}
          </div>
          <div className="pumpers-container">
            <GetTopPumpers
              selectedFights={selectedIds}
              reportCode={reportCode}
              metaData={metaData}
            />
          </div>
        </>
      )}
    </>
  );
}

export default App;
