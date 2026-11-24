import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Brand } from "./brandTypes";
import { getAllBrands, createBrand, getBrandById, updateBrand,  deleteBrand } from "@/services/brandService";

interface BrandState {
  brands: Brand[];
  selectedBrand?: Brand;
  loading: boolean;
  error?: string;
}

const initialState: BrandState = {
  brands: [],
  loading: false,
};

// Thunks
export const fetchBrands = createAsyncThunk("brands/fetchAll", getAllBrands);

export const fetchBrandById = createAsyncThunk(
  "brands/fetchById",
  async (id: number) => await getBrandById(id)
);

export const createNewBrand = createAsyncThunk(
  "brands/create",
  async (data: Brand) => await createBrand(data)
);

export const updateExistingBrand = createAsyncThunk(
  "brands/update",
  async ({ id, data }: { id: number; data: Brand }) => await updateBrand(id, data)
);

export const removeBrand = createAsyncThunk(
  "brands/delete",
  async (id: number) => {
    await deleteBrand(id);
    return id;
  }
);

const brandSlice = createSlice({
  name: "brands",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.brands = action.payload;
        state.loading = false;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch brands";
      })
      .addCase(fetchBrandById.fulfilled, (state, action) => {
        state.selectedBrand = action.payload;
      })
      .addCase(createNewBrand.fulfilled, (state, action) => {
        state.brands.push(action.payload);
      })
      .addCase(updateExistingBrand.fulfilled, (state, action) => {
        const index = state.brands.findIndex(brand => brand.id === action.payload.id);
        if (index !== -1) {
          state.brands[index] = action.payload;
        }
      })
      .addCase(removeBrand.fulfilled, (state, action) => {
        state.brands = state.brands.filter(brand => brand.id !== action.payload);
      });
  },
});

export const brandReducer = brandSlice.reducer;



