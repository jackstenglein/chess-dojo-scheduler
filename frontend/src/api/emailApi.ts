import { AxiosResponse } from 'axios';
import { axiosService } from './axiosService';

export interface EmailApiContextType {
    createSupportTicket: (
        request: SupportTicketRequest,
    ) => Promise<AxiosResponse<SupportTicketResponse>>;
}

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
    return axiosService.post<null>(
        `/public/dojodigest/unsubscribe`,
        { email },
        { functionName: 'unsubscribeFromDojoDigest' },
    );
}

/**
 * Creates a support ticket with the given request.
 * @param idToken The id token of the current signed-in user.
 * @param request The support ticket request.
 * @returns An AxiosResponse containing the SupportTicketResponse.
 */
export function createSupportTicket(idToken: string, request: SupportTicketRequest) {
    if (idToken) {
        return axiosService.post<SupportTicketResponse>(`/support-ticket`, request, {
            headers: { Authorization: `Bearer ${idToken}` },
            functionName: 'createSupportTicket',
        });
    }
    return axiosService.post<SupportTicketResponse>(`/public/support-ticket`, request, {
        functionName: 'createSupportTicket',
    });
}
