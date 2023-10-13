import { ChangeEvent } from "react";
import { Report } from "../wcl/gql/types";
import { getFights } from "../wcl/util/queryWCL";
import { parseWCLUrl } from "../wcl/util/parseWCLUrl";

interface WCLUrlInputProps {
  onFightChange: (newFightReport: Report | undefined) => void;
}

export const WCLUrlInput = ({ onFightChange }: WCLUrlInputProps) => {
  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const newUrl = event.target.value;

    const reportCode = parseWCLUrl(newUrl);

    if (!reportCode) {
      onFightChange(undefined);
      return;
    }
    const newFightReport = await getFights({ reportID: reportCode });

    onFightChange(newFightReport);
  };

  return (
    <input
      type="text"
      className="url-input"
      onChange={handleChange}
      placeholder="Enter WCL URL"
    />
  );
};
