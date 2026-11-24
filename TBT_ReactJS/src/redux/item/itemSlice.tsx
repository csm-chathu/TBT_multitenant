import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from "../../services/itemService";
import { Item } from "./itemTypes";

interface ItemState {
  items: Item[];
  selectedItem?: Item;
  loading: boolean;
  error?: string;
}

const initialState: ItemState = {
  items: [],
  loading: false,
};

// Thunks
export const fetchItems = createAsyncThunk("items/fetchAll", getAllItems);

export const fetchItemById = createAsyncThunk(
  "items/fetchById",
  async (id: number) => await getItemById(id)
);

export const createNewItem = createAsyncThunk(
  "items/create",
  async (data: Item) => await createItem(data)
);

export const updateExistingItem = createAsyncThunk(
  "items/update",
  async ({ id, data }: { id: number; data: Item }) => await updateItem(id, data)
);

export const removeItem = createAsyncThunk(
  "items/delete",
  async (id: number) => {
    await deleteItem(id);
    return id;
  }
);

// Slice
const itemSlice = createSlice({
  name: "items",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchItemById.fulfilled, (state, action) => {
        state.selectedItem = action.payload;
      })
      .addCase(createNewItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateExistingItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(removeItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export const itemReducer = itemSlice.reducer;
