import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Country } from "./countryTypes";
import { getAllCountries } from "@/services/countryService";

interface CountryState {
  list: Country[];
  loading: boolean;
  error?: string;
}

const initialState: CountryState = {
  list: [],
  loading: false,
};

export const fetchCountries = createAsyncThunk("countries/fetchAll", async () => {
  return await getAllCountries();
});

const countrySlice = createSlice({
  name: "countries",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCountries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.list = action.payload;
        state.loading = false;
      })
      .addCase(fetchCountries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const countryReducer = countrySlice.reducer;


