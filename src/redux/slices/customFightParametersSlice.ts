import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TimeSkipIntervals } from "../../helpers/types";

type initalState = {
  timeSkipIntervals: TimeSkipIntervals[];
  customBlacklist: string;
  onlyBossDamage: boolean;
  parameterError: boolean;
  parameterErrorMsg: string;
  showOptions: boolean;
};

const initialState: initalState = {
  timeSkipIntervals: [],
  customBlacklist: "",
  onlyBossDamage: false,
  parameterError: false,
  parameterErrorMsg: "",
  showOptions: false,
};

const customFightParametersSlice = createSlice({
  name: "customFightParameters",
  initialState,
  reducers: {
    setTimeSkipIntervals: (
      state,
      action: PayloadAction<TimeSkipIntervals[]>
    ) => {
      state.timeSkipIntervals = action.payload;
    },
    setCustomBlacklist: (state, action: PayloadAction<string>) => {
      state.customBlacklist = action.payload;
    },
    setOnlyBossDamage: (state, action: PayloadAction<boolean>) => {
      state.onlyBossDamage = action.payload;
    },
    setParameterError: (state, action: PayloadAction<boolean>) => {
      state.parameterError = action.payload;
    },
    setParameterErrorMsg: (state, action: PayloadAction<string>) => {
      state.parameterErrorMsg = action.payload;
    },
    setShowOptions: (state, action: PayloadAction<boolean>) => {
      state.showOptions = action.payload;
    },
  },
});

export const {
  setTimeSkipIntervals,
  setCustomBlacklist,
  setOnlyBossDamage,
  setParameterError,
  setParameterErrorMsg,
  setShowOptions,
} = customFightParametersSlice.actions;
export default customFightParametersSlice.reducer;
