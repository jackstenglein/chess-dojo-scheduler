import ReactGA from 'react-ga4';

import { User } from '../database/user';

export enum EventType {
    // Auth events
    Login = 'login',
    Logout = 'logout',
    Signup = 'signup',
    SignupConfirm = 'signup_confirm',
    ForgotPassword = 'forgot_password',
    ForgotPasswordConfirm = 'forgot_password_confirm',

    // Profile actions
    CreateProfile = 'create_profile',
    EditProfile = 'edit_profile',
    Graduate = 'graduate',
    UpdateProgress = 'update_progress',
    UpdateTimeline = 'update_timeline',
    CreateNondojoTask = 'create_nondojo_task',
    EditNondojoTask = 'edit_nondojo_task',
    DeleteNondojoTask = 'delete_nondojo_task',
    ViewTaskDetails = 'view_task_details',

    // Game actions
    SubmitGame = 'submit_game',
    UpdateGame = 'update_game',
    DeleteGame = 'delete_game',
    SearchGames = 'search_games',

    // Calendar actions
    SetAvailability = 'set_availability',
    BookAvailability = 'book_availability',
    BookCoaching = 'book_coaching',
    CancelMeeting = 'cancel_meeting',

    // Material actions
    CreateSparringLink = 'create_sparring_link',
    CopyFen = 'copy_fen',

    // Upsell
    ViewUpsellDialog = 'view_upsell_dialog',
}

export function trackEvent(type: EventType, params?: any) {
    ReactGA.event(type, params);
}

export function setUser(user: User) {
    ReactGA.set({ userId: user.username });
    setUserCohort(user.dojoCohort);
    setUserSubscriptionStatus(user.subscriptionStatus);
}

export function setUserCohort(cohort: string | undefined) {
    if (cohort) {
        ReactGA.gtag('set', 'user_properties', {
            dojo_cohort: cohort,
        });
    }
}

export function setUserSubscriptionStatus(subscriptionStatus: string | undefined) {
    if (subscriptionStatus) {
        ReactGA.gtag('set', 'user_properties', {
            subscription_status: subscriptionStatus,
        });
    }
}
