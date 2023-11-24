import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TimeSkipIntervals } from "../../helpers/types";
import {
  ABILITY_BLACKLIST,
  ABILITY_NO_BOE_SCALING,
  ABILITY_NO_EM_SCALING,
  ABILITY_NO_SCALING,
  ABILITY_NO_SHIFTING_SCALING,
} from "../../util/constants";

type initialState = {
  timeSkipIntervals: TimeSkipIntervals[];
  parameterError: boolean;
  parameterErrorMsg: string;
  showOptions: boolean;
  enemyBlacklist: number[];
  abilityBlacklist: string;
  abilityNoScaling: string;
  abilityNoBoEScaling: string;
  abilityNoEMScaling: string;
  abilityNoShiftingScaling: string;
  ebonMightWeight: number;
  intervalTimer: number;
  deathCountFilter: string;
};

const initialState: initialState = {
  timeSkipIntervals: [],
  parameterError: false,
  parameterErrorMsg: "",
  showOptions: false,
  enemyBlacklist: [],
  abilityBlacklist: ABILITY_BLACKLIST.toString(),
  abilityNoScaling: ABILITY_NO_SCALING.toString(),
  abilityNoBoEScaling: ABILITY_NO_BOE_SCALING.toString(),
  abilityNoEMScaling: ABILITY_NO_EM_SCALING.toString(),
  abilityNoShiftingScaling: ABILITY_NO_SHIFTING_SCALING.toString(),
  ebonMightWeight: 0.5,
  intervalTimer: 30,
  deathCountFilter: "",
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
    addTimeSkipInterval: (state, action: PayloadAction<TimeSkipIntervals>) => {
      state.timeSkipIntervals.push(action.payload);
    },
    removeTimeSkipInterval: (state, action: PayloadAction<number>) => {
      state.timeSkipIntervals.splice(action.payload, 1);
    },
    changeTimeSkipInterval: (
      state,
      action: PayloadAction<{
        index: number;
        entry: "start" | "end";
        value: string;
      }>
    ) => {
      const { index, entry, value } = action.payload;
      if (entry === "start") {
        state.timeSkipIntervals[index].start = value;
      } else {
        state.timeSkipIntervals[index].end = value;
      }
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
    setAbilityBlacklist: (state, action: PayloadAction<string>) => {
      state.abilityBlacklist = action.payload;
    },
    setAbilityNoScaling: (state, action: PayloadAction<string>) => {
      state.abilityNoScaling = action.payload;
    },
    setAbilityNoBoEScaling: (state, action: PayloadAction<string>) => {
      state.abilityNoBoEScaling = action.payload;
    },
    setAbilityNoEMScaling: (state, action: PayloadAction<string>) => {
      state.abilityNoEMScaling = action.payload;
    },
    setAbilityNoShiftingScaling: (state, action: PayloadAction<string>) => {
      state.abilityNoShiftingScaling = action.payload;
    },
    setEbonMightWeight: (state, action: PayloadAction<number>) => {
      state.ebonMightWeight = action.payload;
    },
    setIntervalTimer: (state, action: PayloadAction<number>) => {
      state.intervalTimer = action.payload;
    },
    setDeathCountFilter: (state, action: PayloadAction<string>) => {
      state.deathCountFilter = action.payload;
    },
  },
});

export const {
  setTimeSkipIntervals,
  setParameterError,
  setParameterErrorMsg,
  setShowOptions,
  modifyEnemyBlacklist,
  setAbilityBlacklist,
  setAbilityNoScaling,
  setAbilityNoBoEScaling,
  setAbilityNoEMScaling,
  setAbilityNoShiftingScaling,
  addTimeSkipInterval,
  removeTimeSkipInterval,
  changeTimeSkipInterval,
  setEbonMightWeight,
  setIntervalTimer,
  setDeathCountFilter,
} = customFightParametersSlice.actions;
export default customFightParametersSlice.reducer;
