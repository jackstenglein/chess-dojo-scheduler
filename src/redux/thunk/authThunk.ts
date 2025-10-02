import {createAsyncThunk} from '@reduxjs/toolkit';
import {signIn, signOut, signUp} from '../../services/AuthService';
import {resetAuth, setToken, setUser} from '../reducers/authSlice';

// Sign in thunk

export const signInUser = createAsyncThunk(
  'auth/signInUser',
  async (
    { email, password }: { email: string; password: string },
    { dispatch }
  ) => {
    const result = await signIn(email, password);
    if (!result) {
      return { response: null, user: null, tokens: null };
    }

    const { response, user, tokens } = result;

    // ✅ Safely convert token to a plain string
    const accessToken =
      typeof tokens?.idToken === 'string'
        ? tokens.idToken
        : tokens?.idToken?.token ?? String(tokens?.idToken ?? '');

    dispatch(setUser(user));
    dispatch(setToken(accessToken));

    return {
      response,
      user,
      tokens: {
        ...tokens,
        idToken: accessToken, // ensure it's a plain string
      },
    };
  }
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
