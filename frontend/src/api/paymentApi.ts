import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { User } from '../database/user';

const BASE_URL = getConfig().api.baseUrl;

export type PaymentApiContextType = {
    /**
     * Creates a subscription checkout session.
     * @param request The SubscriptionCheckoutRequest.
     * @returns A subscription checkout session URL.
     */
    subscriptionCheckout: (
        request: SubscriptionCheckoutRequest
    ) => Promise<AxiosResponse<SubscriptionCheckoutResponse>>;

    /**
     * Creates a subscription manage session.
     * @returns A subscription manage session URL.
     */
    subscriptionManage: () => Promise<AxiosResponse<SubscriptionCheckoutResponse>>;
};

/** A request to create a subscription checkout session. */
export interface SubscriptionCheckoutRequest {
    /** The interval the user requested to subscribe for. */
    interval: 'month' | 'year';

    /** Where to redirect the user upon success. */
    successUrl?: string;

    /** Where to redirect the user if they cancel. */
    cancelUrl?: string;
}

/** A response to a SubscriptionCheckoutRequest. */
interface SubscriptionCheckoutResponse {
    /** The URL of the checkout session. */
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
    return axios.post<SubscriptionCheckoutResponse>(
        `${BASE_URL}/subscription/checkout`,
        request,
        {
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        }
    );
}

/**
 * Creates a subscription manage session.
 * @param idToken The id token of the current signed-in user.
 * @returns A subscription manage session URL.
 */
export function subscriptionManage(idToken: string) {
    return axios.post<SubscriptionCheckoutResponse>(
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
