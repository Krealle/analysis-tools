import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type initialState = {
  selectedIds: number[];
};

const initialState: initialState = {
  selectedIds: [],
};

const fightBoxesSlice = createSlice({
  name: "fightBoxes",
  initialState: initialState,
  reducers: {
    setSelectedIds: (state, action: PayloadAction<number[]>) => {
      state.selectedIds = action.payload;
    },
  },
});

export const { setSelectedIds } = fightBoxesSlice.actions;
export default fightBoxesSlice.reducer;
