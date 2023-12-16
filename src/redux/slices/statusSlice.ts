import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { hasValidWCLAuthentication } from "../../wcl/util/auth";

type initialState = {
  isFetching: boolean;
  hasAuth: boolean;
};

const initialState: initialState = {
  isFetching: false,
  hasAuth: hasValidWCLAuthentication(),
};

const statusSlice = createSlice({
  name: "status",
  initialState: initialState,
  reducers: {
    setIsFetching: (state, action: PayloadAction<boolean>) => {
      state.isFetching = action.payload;
    },
    setHasAuth: (state, action: PayloadAction<boolean>) => {
      state.hasAuth = action.payload;
    },
  },
});

export const { setIsFetching, setHasAuth } = statusSlice.actions;
export default statusSlice.reducer;
