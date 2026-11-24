import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Organization } from "./organizationTypes";
import { getAllOrganizations, deleteOrganization } from "@/services/organizationService";

interface OrganizationState {
  list: Organization[];
  loading: boolean;
  error?: string;
}

const initialState: OrganizationState = {
  list: [],
  loading: false,
};

export const fetchOrganizations = createAsyncThunk(
  "organizations/fetchAll",
  async () => {
    return await getAllOrganizations();
  }
);

export const removeOrganization = createAsyncThunk(
  "organizations/delete",
  async (
    { id, reason }: { id: number; reason?: string },
    thunkAPI,
  ) => {
    try {
      await deleteOrganization(id, reason);
      return id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message || err);
    }
  }
);

const organizationSlice = createSlice({
  name: "organizations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrganizations.fulfilled, (state, action) => {
        state.list = action.payload;
        state.loading = false;
      })
      .addCase(fetchOrganizations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(removeOrganization.fulfilled, (state, action) => {
        state.list = state.list.filter(org => org.id !== action.payload);
      })
      .addCase(removeOrganization.rejected, (state, action) => {
        state.error = action.payload as string | undefined || action.error.message;
      });
  },
});

export const organizationReducer = organizationSlice.reducer;


