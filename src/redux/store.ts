import { configureStore } from "@reduxjs/toolkit";
import WCLUrlInputReducer from "./slices/WCLUrlInputSlice";
import fightBoxesSliceReducer from "./slices/fightBoxesSlice";
import customFightParametersReducer from "./slices/customFightParametersSlice";
import fightInformationSliceReducer from "./slices/fightInformationSlice";
import statusSliceReducer from "./slices/statusSlice";

const store = configureStore({
  reducer: {
    WCLUrlInput: WCLUrlInputReducer,
    fightBoxes: fightBoxesSliceReducer,
    customFightParameters: customFightParametersReducer,
    fightInformation: fightInformationSliceReducer,
    status: statusSliceReducer,
  },
  middleware: [],
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
