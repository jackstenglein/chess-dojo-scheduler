import {createSlice} from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    fcmToken: null,
    user: null,
    performanceData: null,
    token: null,
    introWalkthrough: false,
  },
  reducers: {
    setIntroWalkthrough: (state, action) => {
      state.introWalkthrough = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setPerformanceData: (state, action) => {
      state.performanceData = action.payload;
    },
    resetAuth: state => {
      state.token = null;
      state.user = null;
      state.fcmToken = null;
    },
  },
});

export const {
  setIntroWalkthrough,
  setToken,
  setUser,
  setPerformanceData,
  resetAuth,
} = authSlice.actions;
export default authSlice.reducer;
