import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getAllTeams,
  getTeamById,
  createTeam,
  createTeamWithAgents,
  updateTeam,
  deleteTeam,
} from '../../services/teamService';
import { Team, CreateTeamWithAgentsDto } from './teamTypes';

interface TeamState {
  teams: Team[];
  selectedTeam?: Team;
  loading: boolean;
  error?: string;
}

const initialState: TeamState = {
  teams: [],
  loading: false,
};

// Thunks
export const fetchTeams = createAsyncThunk('teams/fetchAll', getAllTeams);

export const fetchTeamById = createAsyncThunk(
  'teams/fetchById',
  async (id: number) => await getTeamById(id)
);

export const createNewTeam = createAsyncThunk(
  'teams/create',
  async (data: Team) => await createTeam(data)
);

export const createNewTeamWithAgents = createAsyncThunk(
  'teams/createWithAgents',
  async (data: CreateTeamWithAgentsDto) => await createTeamWithAgents(data)
);

export const updateExistingTeam = createAsyncThunk(
  'teams/update',
  async ({ id, data }: { id: number; data: Team }) =>
    await updateTeam(id, data)
);

export const removeTeam = createAsyncThunk(
  'teams/delete',
  async (payload: number | { id: number; reason?: string }, thunkAPI) => {
    let id: number;
    let reason: string | undefined;
    if (typeof payload === 'number') {
      id = payload;
    } else {
      id = payload.id;
      reason = payload.reason;
    }

    try {
      await deleteTeam(id, reason);
      return id;
    } catch (err: any) {
      const payloadData = err?.response?.data ?? { message: err?.message ?? 'Request failed' };
      return thunkAPI.rejectWithValue(payloadData);
    }
  }
);

// Slice
const teamSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.teams = action.payload;
        state.loading = false;
      })
      .addCase(fetchTeamById.fulfilled, (state, action) => {
        state.selectedTeam = action.payload;
      })
      .addCase(createNewTeam.fulfilled, (state, action) => {
        state.teams.push(action.payload);
      })
      .addCase(createNewTeamWithAgents.fulfilled, (state, action) => {
        state.teams.push(action.payload);
      })
      .addCase(updateExistingTeam.fulfilled, (state, action) => {
        const index = state.teams.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.teams[index] = action.payload;
        }
      })
      .addCase(removeTeam.fulfilled, (state, action) => {
        state.teams = state.teams.filter(t => t.id !== action.payload);
      });
  },
});

export default teamSlice.reducer;
