import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../../services/locationService";
import { Location } from "./locationTypes";

interface LocationState {
  locations: Location[];
  selectedLocation?: Location;
  loading: boolean;
  error?: string;
}

const initialState: LocationState = {
  locations: [],
  loading: false,
};

// Thunks
export const fetchLocations = createAsyncThunk(
  "locations/fetchAll",
  getAllLocations
);

export const fetchLocationById = createAsyncThunk(
  "locations/fetchById",
  async (id: number) => await getLocationById(id)
);

export const createNewLocation = createAsyncThunk(
  "locations/create",
  async (data: Location) => await createLocation(data)
);

export const updateExistingLocation = createAsyncThunk(
  "locations/update",
  async ({ id, data }: { id: number; data: Location }) =>
    await updateLocation(id, data)
);

export const removeLocation = createAsyncThunk(
  "locations/delete",
  async (id: number) => {
    await deleteLocation(id);
    return id;
  }
);

// Slice
const locationSlice = createSlice({
  name: "locations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.locations = action.payload;
        state.loading = false;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchLocationById.fulfilled, (state, action) => {
        state.selectedLocation = action.payload;
      })
      .addCase(createNewLocation.fulfilled, (state, action) => {
        state.locations.push(action.payload);
      })
      .addCase(updateExistingLocation.fulfilled, (state, action) => {
        const index = state.locations.findIndex(
          (loc) => loc.id === action.payload.id
        );
        if (index !== -1) {
          state.locations[index] = action.payload;
        }
      })
      .addCase(removeLocation.fulfilled, (state, action) => {
        state.locations = state.locations.filter(
          (loc) => loc.id !== action.payload
        );
      });
  },
});

export const locationReducer = locationSlice.reducer;
