import { useState } from "react";
import { useAppSelector } from "../../redux/hooks";
import { Fight, generateFights } from "./generateFights";
import FightButtons from "../FightButtons";
import bearDancing from "/static/bear/dance.gif";
const EventNormalizer = () => {
  const [content, setContent] = useState<JSX.Element | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const WCLReport = useAppSelector((state) => state.WCLUrlInput.fightReport);
  const selectedFights = useAppSelector(
    (state) => state.fightBoxes.selectedIds
  );

  const { parameterError, parameterErrorMsg } = useAppSelector(
    (state) => state.customFightParameters
  );

  const handleButtonClick = async () => {
    if (selectedFights.length === 0) {
      alert("No fight selected!");
      return;
    }
    if (parameterError) {
      alert(parameterErrorMsg);
      return;
    }

    setIsFetching(true);
    setContent(
      <>
        <big>Fetching data</big>
        <br />
        <img src={bearDancing} />
      </>
    );

    try {
      await attemptNormalize();
      setContent(null);
    } catch (error) {
      setContent(<>{error}</>);
    }

    setIsFetching(false);
  };

  async function attemptNormalize() {
    if (!WCLReport?.fights) {
      throw new Error("No fight report found");
    }

    /** FIXME: This is static so we can keep forcing new data */
    const storedFights: Fight[] = [];

    try {
      await generateFights(
        WCLReport,
        selectedFights,
        WCLReport.fights,
        storedFights
      );
      setContent(null);
    } catch (error) {
      setContent(<>{error}</>);
    }

    setIsFetching(false);
  }

  return (
    <div className="pumpers-container">
      <FightButtons
        isFetching={isFetching}
        handleButtonClick={handleButtonClick}
      />
      {content}
    </div>
  );
};

export default EventNormalizer;
