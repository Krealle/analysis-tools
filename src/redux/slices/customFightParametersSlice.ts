import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TimeSkipIntervals } from "../../helpers/types";

type initalState = {
  timeSkipIntervals: TimeSkipIntervals[];
  customBlacklist: string;
  onlyBossDamage: boolean;
  parameterError: boolean;
  parameterErrorMsg: string;
  showOptions: boolean;
  enemyBlacklist: number[];
};

const initialState: initalState = {
  timeSkipIntervals: [],
  customBlacklist: "",
  onlyBossDamage: false,
  parameterError: false,
  parameterErrorMsg: "",
  showOptions: false,
  enemyBlacklist: [],
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
    modifyEnemyBlacklist: (
      state,
      action: PayloadAction<{ value: number; add: boolean }>
    ) => {
      const { value, add } = action.payload;
      if (add) {
        state.enemyBlacklist.push(value);
      } else {
        state.enemyBlacklist = state.enemyBlacklist.filter(
          (item) => item !== value
        );
      }
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
  modifyEnemyBlacklist,
} = customFightParametersSlice.actions;
export default customFightParametersSlice.reducer;
