import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { StateModel } from "./stateTypes";
import { getStatesByCountry } from "@/services/stateService";

interface StateState {
  list: StateModel[];
  loading: boolean;
  error?: string;
}

const initialState: StateState = {
  list: [],
  loading: false,
};

export const fetchStatesByCountry = createAsyncThunk(
  "states/fetchByCountry",
  async (countryId: number) => await getStatesByCountry(countryId)
);

const stateSlice = createSlice({
  name: "states",
  initialState,
  reducers: {
    clearStates: (state) => {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatesByCountry.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStatesByCountry.fulfilled, (state, action) => {
        state.list = action.payload;
        state.loading = false;
      })
      .addCase(fetchStatesByCountry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearStates } = stateSlice.actions;
export const stateReducer = stateSlice.reducer;


