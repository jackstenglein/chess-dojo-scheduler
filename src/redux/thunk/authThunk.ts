import {createAsyncThunk} from '@reduxjs/toolkit';
import {signIn, signOut, signUp} from '../../services/AuthService';
import {resetAuth, setToken, setUser} from '../reducers/authSlice';

// Sign in thunk
export const signInUser = createAsyncThunk(
  'auth/signInUser',
  async ({email, password}: {email: string; password: string}, {dispatch}) => {
    const {response, user, tokens} = (await signIn(email, password)) ?? {};

    // update redux slice
    dispatch(setUser(user));
    dispatch(setToken(tokens?.idToken?.toString() ?? null));

    return {response, user, tokens};
  },
);

// Sign up thunk
export const signUpUser = createAsyncThunk(
  'auth/signUpUser',
  async ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) => {
    return await signUp(name, email, password);
  },
);

// Sign out thunk
export const signOutUser = createAsyncThunk(
  'auth/signOutUser',
  async (_, {dispatch}) => {
    await signOut();
    dispatch(resetAuth());
  },
);
