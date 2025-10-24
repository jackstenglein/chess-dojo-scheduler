import {createSlice} from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    fcmToken: null,
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setFcmToken: (state, action) => {
      // Add this too
      state.fcmToken = action.payload;
    },
    resetAuth: state => {
      state.token = null;
      state.user = null;
      state.fcmToken = null;
    },
  },
});

export const {setToken, setUser, setFcmToken, resetAuth} = authSlice.actions;
export default authSlice.reducer;
