import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  fetchAuthSession,
  signInWithRedirect,
  resetPassword,
  confirmResetPassword,
} from 'aws-amplify/auth';
import {v4 as uuidv4} from 'uuid';
import AlertService from './ToastService';

export async function testAmplifyConnection() {
  try {
    const session = await fetchAuthSession();
    if (!session.identityId) {
      signOut();
      }
    return true;
  } catch (error) {
    return false;
  }
}
/**
 * Sign in user with email & password
 */
export async function signIn(email: string, password: string) {
  try {
    await testAmplifyConnection();

    const response = await amplifySignIn({username: email, password});
    
    const authUser = await amplifyGetCurrentUser();
    const authSession = await fetchAuthSession({forceRefresh: true});
    
    AlertService.toastPrompt('Success', 'Signed in successfully!');
    return {
      response,
      user: authUser,
      tokens: authSession.tokens,
    };
  } catch (error: any) {
  
    if (error?.name === 'UserAlreadyAuthenticatedException') {
      console.warn('User is already authenticated');
      signOut();
    }

    throw error;
  }
}

export async function signInSimple(email: string, password: string) {
  try {
    const response = await amplifySignIn({username: email, password});
    return response;
  } catch (error) {
    throw error;
  }
}
/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    await amplifySignOut();
  } catch (error) {
    throw error;
  }
}

/**
 * Sign up a new user with name, email & password
 */
export async function signUp(name: string, email: string, password: string) {
  try {
    const username = uuidv4();
    const response = await amplifySignUp({
      username,
      password,
      options: {
        userAttributes: {email, name},
      },
    });

    return {...response, username};
  } catch (error) {
    console.error('❌ Sign up failed:', error);
    throw error;
  }
}

/**
 * Sign up and Sign in new user with Google
 */
export async function socialSignin(provider: 'Google') {
  try {
    await signInWithRedirect({provider})
      .then(res => {
      })
      .catch(err => {
        throw err;
      });
    // The actual sign-in completion will be handled after redirection
    // You may need to handle the redirect response in your app's entry point
   } catch (err) {
    throw err;
  }
}

export async function forgotPassword(email: string) {
  return await resetPassword({username: email});
}

export async function forgotPasswordConfirm(email: string, code: string, password: string) {
  return confirmResetPassword({
    username: email,
    confirmationCode: code,
    newPassword: password,
  });
}
