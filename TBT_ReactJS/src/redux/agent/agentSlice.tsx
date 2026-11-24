import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
} from "../../services/agentService";
import { Agent, CreateAgentDto, UpdateAgentDto } from "./agentTypes";

interface AgentState {
  agents: Agent[];
  selectedAgent?: Agent;
  loading: boolean;
  error?: string;
}

const initialState: AgentState = {
  agents: [],
  loading: false,
};

// Thunks
export const fetchAgents = createAsyncThunk("agents/fetchAll", getAllAgents);

export const fetchAgentById = createAsyncThunk(
  "agents/fetchById",
  async (id: number) => await getAgentById(id)
);

export const createNewAgent = createAsyncThunk(
  "agents/create",
  async (data: CreateAgentDto) => await createAgent(data)
);

export const updateExistingAgent = createAsyncThunk(
  "agents/update",
  async ({ id, data }: { id: number; data: UpdateAgentDto }) =>
    await updateAgent(id, data)
);

export const removeAgent = createAsyncThunk(
  "agents/delete",
  async (payload: number | { id: number; reason?: string }, thunkAPI) => {
    let id: number;
    let reason: string | undefined;
    if (typeof payload === "number") {
      id = payload;
    } else {
      id = payload.id;
      reason = payload.reason;
    }

    try {
      await deleteAgent(id, reason);
      return id;
    } catch (err: any) {
      const payloadData = err?.response?.data ?? { message: err?.message ?? 'Request failed' };
      return thunkAPI.rejectWithValue(payloadData);
    }
  }
);

// Slice
const agentSlice = createSlice({
  name: "agents",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.agents = action.payload;
        state.loading = false;
      })
      .addCase(fetchAgentById.fulfilled, (state, action) => {
        state.selectedAgent = action.payload;
      })
      .addCase(createNewAgent.fulfilled, (state, action) => {
        state.agents.push(action.payload);
      })
      .addCase(updateExistingAgent.fulfilled, (state, action) => {
        const index = state.agents.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.agents[index] = action.payload;
        }
      })
      .addCase(removeAgent.fulfilled, (state, action) => {
        state.agents = state.agents.filter((t) => t.id !== action.payload);
      });
  },
});

export default agentSlice.reducer;
