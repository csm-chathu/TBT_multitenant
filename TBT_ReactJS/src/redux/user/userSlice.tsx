import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { changePassword as changePasswordService, getMe } from '@/services/userService'
import { User } from './userTypes'

interface UserState {
  loading: boolean
  error?: string | null
  success?: boolean
  user?: User | null
}

const initialState: UserState = {
  loading: false,
  error: null,
  success: false,
  user: null,
}

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (payload: { oldPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const res = await changePasswordService(payload)
      return res
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to change password')
    }
  }
)

export const fetchMe = createAsyncThunk('user/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await getMe()
    return res
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to fetch user')
  }
})

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserStatus(state) {
      state.error = null
      state.success = false
      state.loading = false
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true
        state.error = null
        state.success = false
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false
        state.success = true
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || action.error.message || 'Failed'
      })
      .addCase(fetchMe.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch user'
      })
  },
})

export const { clearUserStatus, setUser } = userSlice.actions

// Selectors
export const selectCurrentUser = (state: any) => state.user?.user
export const selectUserLoading = (state: any) => state.user?.loading
export const selectUserError = (state: any) => state.user?.error

export default userSlice.reducer
