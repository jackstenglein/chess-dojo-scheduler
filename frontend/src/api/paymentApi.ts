import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { User } from '../database/user';
import { StripeAccount } from '../database/payment';

const BASE_URL = getConfig().api.baseUrl;

export interface PaymentApiContextType {
    /**
     * Creates a subscription checkout session.
     * @param request The SubscriptionCheckoutRequest.
     * @returns A subscription checkout session URL.
     */
    subscriptionCheckout: (
        request: SubscriptionCheckoutRequest
    ) => Promise<AxiosResponse<StripeUrlResponse>>;

    /**
     * Creates a subscription manage session.
     * @returns A subscription manage session URL.
     */
    subscriptionManage: () => Promise<AxiosResponse<StripeUrlResponse>>;

    /**
     * Creates a Stripe account for the current user.
     * @returns A Stripe account link URL.
     */
    createPaymentAccount: () => Promise<AxiosResponse<StripeUrlResponse>>;

    /**
     * Gets the Stripe account for the current user.
     * @returns A Stripe account.
     */
    getPaymentAccount: () => Promise<AxiosResponse<StripeAccount>>;

    /**
     * Gets a Stripe Connect account login link for the current user.
     * @returns A stripe login link URL.
     */
    paymentAccountLogin: () => Promise<AxiosResponse<StripeUrlResponse>>;
}

/** A request to create a subscription checkout session. */
export interface SubscriptionCheckoutRequest {
    /** The interval the user requested to subscribe for. */
    interval: 'month' | 'year';

    /** Where to redirect the user upon success. */
    successUrl?: string;

    /** Where to redirect the user if they cancel. */
    cancelUrl?: string;
}

/** A common response to Stripe requests. Contains a URL to Stripe workflows. */
interface StripeUrlResponse {
    /** The Stripe URL. */
    url: string;
}

/**
 * Creates a subscription checkout session.
 * @param idToken The id token of the current signed-in user.
 * @param request The SubscriptionCheckoutRequest.
 * @returns A subscription checkout session URL.
 */
export function subscriptionCheckout(
    idToken: string,
    request: SubscriptionCheckoutRequest
) {
    return axios.post<StripeUrlResponse>(`${BASE_URL}/subscription/checkout`, request, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * Creates a subscription manage session.
 * @param idToken The id token of the current signed-in user.
 * @returns A subscription manage session URL.
 */
export function subscriptionManage(idToken: string) {
    return axios.post<StripeUrlResponse>(
        `${BASE_URL}/subscription/manage`,
        {},
        { headers: { Authorization: 'Bearer ' + idToken } }
    );
}

/**
 * Syncs local anonymous purchases with the user's saved purchases in DynamoDB.
 * @param idToken The id token of the current signed-in user.
 * @param purchases A map from the id of the purchased item to the Stripe checkout session id.
 */
export function syncPurchases(idToken: string, purchases: Record<string, string>) {
    return axios.post<User>(`${BASE_URL}/purchases/sync`, purchases, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * Creates a Stripe account for the current user.
 * @param idToken The id token of the current signed-in user.
 * @returns A Stripe account link URL.
 */
export function createPaymentAccount(idToken: string) {
    return axios.put<StripeUrlResponse>(
        `${BASE_URL}/payment/account`,
        {},
        {
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        }
    );
}

/**
 * Gets the Stripe account for the current user.
 * @param idToken The id token of the current signed-in user.
 * @returns A Stripe account.
 */
export function getPaymentAccount(idToken: string) {
    return axios.get<StripeAccount>(`${BASE_URL}/payment/account`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * Gets a Stripe Connect account login link for the current user.
 * @param idToken The id token of the current signed-in user.
 * @returns A stripe login link URL.
 */
export function paymentAccountLogin(idToken: string) {
    return axios.get<StripeUrlResponse>(`${BASE_URL}/payment/account/login`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}
