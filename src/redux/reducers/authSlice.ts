import {createSlice} from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    resetAuth: state => {
      state.token = null;
      state.user = null;
    },
  },
});

export const {
  setToken,
  setUser,
  resetAuth,
} = authSlice.actions;
export default authSlice.reducer;
