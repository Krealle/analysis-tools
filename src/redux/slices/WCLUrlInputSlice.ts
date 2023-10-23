import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WCLReport } from "../../wcl/gql/types";

type initalState = {
  fightReport: WCLReport | undefined;
};

const initalState: initalState = {
  fightReport: undefined,
};

const WCLUrlInputSlice = createSlice({
  name: "fightReport",
  initialState: initalState,
  reducers: {
    setFightReport: (state, action: PayloadAction<WCLReport | undefined>) => {
      state.fightReport = action.payload;
    },
  },
});

export const { setFightReport } = WCLUrlInputSlice.actions;
export default WCLUrlInputSlice.reducer;
