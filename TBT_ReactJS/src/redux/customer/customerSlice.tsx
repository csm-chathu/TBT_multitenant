import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Customer } from "./customerTypes";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type CustomerFilters,
} from "@/services/customerService";

interface CustomerMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CustomerState {
  customers: Customer[];
  meta: CustomerMeta;
  selectedCustomer?: Customer;
  loading: boolean;
  error?: string;
}

const initialState: CustomerState = {
  customers: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  loading: false,
};

// Thunks
export const fetchCustomers = createAsyncThunk(
  "customers/fetchAll",
  async (filters?: CustomerFilters) => getAllCustomers(filters)
);

export const fetchCustomerById = createAsyncThunk(
  "customers/fetchById",
  async (id: number) => await getCustomerById(id)
);

export const createNewCustomer = createAsyncThunk(
  "customers/create",
  async (data: Customer) => await createCustomer(data)
);

export const updateExistingCustomer = createAsyncThunk(
  "customers/update",
  async ({ id, data }: { id: number; data: Customer }) =>
    await updateCustomer(id, data)
);

export const removeCustomer = createAsyncThunk(
  "customers/delete",
  async (payload: number | { id: number; reason?: string }, thunkAPI) => {
    const id = typeof payload === 'number' ? payload : payload.id;
    const reason = typeof payload === 'number' ? undefined : payload.reason;
    try {
      await deleteCustomer(id, reason);
      return id;
    } catch (err: any) {
      const payloadData = err?.response?.data ?? { message: err?.message ?? 'Request failed' };
      return thunkAPI.rejectWithValue(payloadData);
    }
  }
);

const customerSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        const payload = action.payload as any;
        if (Array.isArray(payload)) {
          state.customers = payload;
          state.meta = { total: payload.length, page: 1, limit: payload.length || 10, totalPages: 1 };
        } else {
          state.customers = payload.data ?? [];
          state.meta = {
            total: payload.total ?? 0,
            page: payload.page ?? 1,
            limit: payload.limit ?? 10,
            totalPages: payload.totalPages ?? 1,
          };
        }
        state.loading = false;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.selectedCustomer = action.payload;
      })
      .addCase(createNewCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
      })
      .addCase(updateExistingCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
        if (state.selectedCustomer?.id === action.payload.id) {
          state.selectedCustomer = { ...state.selectedCustomer, ...action.payload };
        }
      })
      .addCase(removeCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(c => c.id !== action.payload);
        state.meta.total = Math.max(0, state.meta.total - 1);
      });
  },
});

export const customerReducer = customerSlice.reducer;
