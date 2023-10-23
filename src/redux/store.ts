import { configureStore } from "@reduxjs/toolkit";
import WCLUrlInputReducer from "./slices/WCLUrlInputSlice";
import fightBoxesSliceReducer from "./slices/FightBoxesSlice";
import customFightParametersReducer from "./slices/customFightParametersSlice";

const store = configureStore({
  reducer: {
    WCLUrlInput: WCLUrlInputReducer,
    fightBoxes: fightBoxesSliceReducer,
    customFightParameters: customFightParametersReducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;