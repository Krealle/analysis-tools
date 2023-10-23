import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type initalState = {
  selectedIds: number[];
};

const initalState: initalState = {
  selectedIds: [],
};

const fightBoxesSlice = createSlice({
  name: "fightBoxes",
  initialState: initalState,
  reducers: {
    setSelectedIds: (state, action: PayloadAction<number[]>) => {
      state.selectedIds = action.payload;
    },
  },
});

export const { setSelectedIds } = fightBoxesSlice.actions;
export default fightBoxesSlice.reducer;
