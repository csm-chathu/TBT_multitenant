import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Category } from "./categoryTypes";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/categoryService";

interface categorystate {
  categories: Category[];
  selectedCategory?: Category;
  loading: boolean;
  error?: string;
}

const initialState: categorystate = {
  categories: [],
  loading: false,
};

// Thunks
export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  getAllCategories
);

export const fetchCategoryById = createAsyncThunk(
  "categories/fetchById",
  async (id: number) => await getCategoryById(id)
);

export const createNewCategory = createAsyncThunk(
  "categories/create",
  async (data: Category) => await createCategory(data)
);

export const updateExistingCategory = createAsyncThunk(
  "categories/update",
  async ({ id, data }: { id: number; data: Category }) =>
    await updateCategory(id, data)
);

export const removeCategory = createAsyncThunk(
  "categories/delete",
  async (id: number) => {
    await deleteCategory(id);
    return id;
  }
);

const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.loading = false;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.selectedCategory = action.payload;
      })
      .addCase(createNewCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(updateExistingCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(
          (cat) => cat.id === action.payload.id
        );
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(removeCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (cat) => cat.id !== action.payload
        );
      });
  },
});

export const categoryReducer = categorySlice.reducer;
