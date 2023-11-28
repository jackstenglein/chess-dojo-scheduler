import axios from 'axios';

import { getConfig } from '../config';
import { User } from '../database/user';

const BASE_URL = getConfig().api.baseUrl;

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
