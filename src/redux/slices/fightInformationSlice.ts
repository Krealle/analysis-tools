import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FightTracker } from "../../helpers/types";

type initialState = {
  fightTracker: FightTracker[];
};

const initialState: initialState = {
  fightTracker: [],
};

const fightInformationSlice = createSlice({
  name: "fightInformation",
  initialState: initialState,
  reducers: {
    setFightTracker: (state, action: PayloadAction<FightTracker[]>) => {
      state.fightTracker = action.payload;
    },
  },
});

export const { setFightTracker } = fightInformationSlice.actions;
export default fightInformationSlice.reducer;
