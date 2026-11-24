import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  type TicketFilters,
} from "../../services/ticketService";
import { Ticket, CreateTicketDto, UpdateTicketDto } from "./ticketTypes";

export interface TicketUpdateEvent {
  type: 'created' | 'updated' | 'comment'
  id?: number
  hash?: string
  title?: string
  subtitle?: string
}

interface TicketState {
  tickets: Ticket[];
  selectedTicket?: Ticket;
  staleTickets?: number[];
  ticketUpdated?: TicketUpdateEvent | boolean;
  selectedLoading?: boolean;
  selectedError?: string | null;
  loading: boolean;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: TicketState = {
  tickets: [],
  staleTickets: [],
  ticketUpdated: undefined,
  selectedLoading: false,
  selectedError: null,
  loading: false,
};

// Thunks
export const fetchTickets = createAsyncThunk(
  "tickets/fetchAll",
  async (filters?: TicketFilters) => await getAllTickets(filters)
);

export const fetchTicketById = createAsyncThunk(
  "tickets/fetchById",
  async (id: number) => await getTicketById(id)
);

export const createNewTicket = createAsyncThunk(
  "tickets/create",
  async (data: CreateTicketDto) => await createTicket(data)
);

export const updateExistingTicket = createAsyncThunk(
  "tickets/update",
  async ({ id, data }: { id: number; data: UpdateTicketDto }) =>
    await updateTicket(id, data)
);

export const removeTicket = createAsyncThunk(
  "tickets/delete",
  async (id: number) => {
    await deleteTicket(id);
    return id;
  }
);

// Slice
const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = undefined;
    },
    clearSelectedTicket: (state) => {
      state.selectedTicket = undefined;
    },
    setSelectedTicket: (state, action) => {
      state.selectedTicket = action.payload;
    },
    addTicketRealtime: (state, action) => {
      const t = action.payload
      if (!t) return
      // prepend if not already present
      if (!state.tickets.find((x) => x.id === t.id)) state.tickets.unshift(t)
    },
    upsertTicketRealtime: (state, action) => {
      const t = action.payload
      if (!t) return
      const idx = state.tickets.findIndex((x) => x.id === t.id)
      if (idx !== -1) state.tickets[idx] = { ...state.tickets[idx], ...t }
      else state.tickets.unshift(t)
    },
    removeTicketRealtime: (state, action) => {
      const id = action.payload
      state.tickets = state.tickets.filter((t) => t.id !== id)
    },
    markTicketStale: (state, action) => {
      const id = action.payload
      if (!id) return
      const n = Number(id)
      if (!state.staleTickets) state.staleTickets = []
      if (!state.staleTickets.includes(n)) state.staleTickets.push(n)
    },
    clearTicketStale: (state, action) => {
      const id = action.payload
      if (id === undefined || id === null) return
      const n = Number(id)
      state.staleTickets = (state.staleTickets || []).filter((x) => x !== n)
    },
    clearAllStale: (state) => { state.staleTickets = [] },
    setTicketUpdated: (state, action: PayloadAction<TicketUpdateEvent | undefined>) => {
      state.ticketUpdated = action.payload ?? true
    },
    clearTicketUpdated: (state) => { state.ticketUpdated = undefined },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        if (action.payload && typeof action.payload === 'object' && 'data' in action.payload && !Array.isArray(action.payload)) {
          state.tickets = action.payload.data;
          state.meta = action.payload.meta;
        } else {
          state.tickets = action.payload;
        }
        state.loading = false;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchTicketById.pending, (state) => {
        state.selectedLoading = true
        state.selectedError = null
        state.selectedTicket = undefined
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.selectedTicket = action.payload;
        state.selectedLoading = false
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.selectedLoading = false
        state.selectedError = action.error?.message ?? 'Failed to load ticket'
      })
      .addCase(createNewTicket.fulfilled, (state, action) => {
        state.tickets.push(action.payload);
      })
      .addCase(updateExistingTicket.fulfilled, (state, action) => {
        const index = state.tickets.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      .addCase(removeTicket.fulfilled, (state, action) => {
        state.tickets = state.tickets.filter((t) => t.id !== action.payload);
      });
  },
});

export const { clearError, clearSelectedTicket, setSelectedTicket, addTicketRealtime, upsertTicketRealtime, removeTicketRealtime, markTicketStale, clearTicketStale, clearAllStale, setTicketUpdated, clearTicketUpdated } = ticketSlice.actions;
export const selectStaleTickets = (state: any) => state.tickets?.staleTickets ?? []
export const selectTicketUpdated = (state: any) => state.tickets?.ticketUpdated as TicketUpdateEvent | boolean | undefined
export const selectSelectedTicket = (state: any) => state.tickets?.selectedTicket
export const selectSelectedTicketLoading = (state: any) => Boolean(state.tickets?.selectedLoading)
export const selectSelectedTicketError = (state: any) => state.tickets?.selectedError ?? null
export const selectTicketMeta = (state: any) => state.tickets?.meta
export default ticketSlice.reducer; 