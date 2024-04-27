import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';

const BASE_URL = getConfig().api.baseUrl;

export type EmailApiContextType = {
    createSupportTicket: (
        request: SupportTicketRequest,
    ) => Promise<AxiosResponse<SupportTicketResponse>>;
};

export interface SupportTicketRequest {
    name: string;
    email: string;
    subject: string;
    message: string;
}

interface SupportTicketResponse {
    ticketId: string;
}

/**
 * Unsubscribes an email address from the Dojo Digest.
 * @param email The email to unsubscribe from the Dojo Digest.
 * @returns An empty AxiosResponse.
 */
export function unsubscribeFromDojoDigest(email: string) {
    return axios.post<void>(`${BASE_URL}/public/dojodigest/unsubscribe`, { email });
}

/**
 * Creates a support ticket with the given request.
 * @param idToken The id token of the current signed-in user.
 * @param request The support ticket request.
 * @returns An AxiosResponse containing the SupportTicketResponse.
 */
export function createSupportTicket(idToken: string, request: SupportTicketRequest) {
    if (idToken) {
        return axios.post<SupportTicketResponse>(`${BASE_URL}/support-ticket`, request, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
    }
    return axios.post<SupportTicketResponse>(
        `${BASE_URL}/public/support-ticket`,
        request,
    );
}
