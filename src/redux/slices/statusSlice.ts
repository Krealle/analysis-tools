import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type initialState = {
  isFetching: boolean;
};

const initialState: initialState = {
  isFetching: false,
};

const statusSlice = createSlice({
  name: "status",
  initialState: initialState,
  reducers: {
    setIsFetching: (state, action: PayloadAction<boolean>) => {
      state.isFetching = action.payload;
    },
  },
});

export const { setIsFetching } = statusSlice.actions;
export default statusSlice.reducer;
