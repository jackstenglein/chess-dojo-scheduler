import axios from 'axios';

import { getConfig } from '@/config';

const BASE_URL = getConfig().api.baseUrl;

/**
 * Unsubscribes an email address from the Dojo Digest.
 * @param email The email to unsubscribe from the Dojo Digest.
 * @returns An empty AxiosResponse.
 */
export function unsubscribeFromDojoDigest(email: string) {
    return axios.post<void>(`${BASE_URL}/public/dojodigest/unsubscribe`, { email });
}
