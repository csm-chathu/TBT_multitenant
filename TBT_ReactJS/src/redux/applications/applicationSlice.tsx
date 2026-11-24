import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Application } from "./applicationTypes";
import { getAllApplications, getApplicationById, deleteApplication } from "@/services/applicationService";

interface ApplicationState {
  applications: Application[];
  selectedApplicaton?: Application;
  loading: boolean;
  error?: string;
}

const initialState: ApplicationState = {
  applications: [],
  loading: false,
};

// Thunks
export const fetchApplications = createAsyncThunk("applications/fetchAll", getAllApplications);

export const fetchApplicationById = createAsyncThunk(
  "applications/fetchById",
  async (id: number) => await getApplicationById(id)
);

export const createNewApplication = createAsyncThunk(
  "applications/create",
    async (data: Application) => {
        // Assuming createApplication is defined in applicationService
        const response = await import('@/services/applicationService').then(module => module.createApplication(data));
        return response;
    }
);

export const updateExistingApplication = createAsyncThunk(
  "applications/update",
  async ({ id, data }: { id: number; data: Application }) => {
    // Assuming updateApplication is defined in applicationService
    const response = await import('@/services/applicationService').then(module => module.updateApplication(id, data));
    return response;
  }
);

export const removeApplication = createAsyncThunk(
  "applications/delete",
  async (
    { id, reason }: { id: number; reason?: string },
    thunkAPI,
  ) => {
    try {
      await deleteApplication(id, reason);
      return id;
    } catch (err: any) {
      // propagate backend payload if available
      return thunkAPI.rejectWithValue(err.response?.data || err.message || err);
    }
  }
);



const applicationSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.applications = action.payload;
        state.loading = false;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchApplicationById.fulfilled, (state, action) => {
        state.selectedApplicaton = action.payload;
      })
      .addCase(createNewApplication.fulfilled, (state, action) => {
        state.applications.push(action.payload);
      })
      .addCase(updateExistingApplication.fulfilled, (state, action) => {
        const index = state.applications.findIndex(app => app.id === action.payload.id);
        if (index !== -1) {
          state.applications[index] = action.payload;
        }
      })
      .addCase(removeApplication.fulfilled, (state, action) => {
        state.applications = state.applications.filter(app => app.id !== action.payload);
      })
      .addCase(removeApplication.rejected, (state, action) => {
        state.error = action.payload as string | undefined || action.error.message;
      });
  },
});

export default applicationSlice.reducer;

