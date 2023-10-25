import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WCLReport } from "../../wcl/gql/types";

type initialState = {
  fightReport: WCLReport | undefined;
};

const initialState: initialState = {
  fightReport: undefined,
};

const WCLUrlInputSlice = createSlice({
  name: "fightReport",
  initialState: initialState,
  reducers: {
    setFightReport: (state, action: PayloadAction<WCLReport | undefined>) => {
      state.fightReport = action.payload;
    },
  },
});

export const { setFightReport } = WCLUrlInputSlice.actions;
export default WCLUrlInputSlice.reducer;
