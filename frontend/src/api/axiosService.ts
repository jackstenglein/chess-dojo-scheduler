import { EventType, trackEvent } from '@/analytics/events';
import { getConfig, LogLevel } from '@/config';
import { fetchAuthSession } from 'aws-amplify/auth';
import axios, { AxiosError } from 'axios';

const config = getConfig();

export const axiosService = axios.create({
    baseURL: config.api.baseUrl,
});

axiosService.interceptors.request.use(async (request) => {
    if (!request.url || !request.url.startsWith('/') || request.url.startsWith('/public/')) {
        return request;
    }

    const authTokens = await fetchAuthSession();
    const idToken = authTokens.tokens?.idToken?.toString();
    if (idToken) {
        request.headers.Authorization = `Bearer ${idToken}`;
    }

    return request;
});

axiosService.interceptors.request.use((request) => {
    if (config.logLevel <= LogLevel.Debug) {
        console.debug(`${request.functionName ?? request.url} request:`, request);
    }
    return request;
});

axiosService.interceptors.response.use(
    (response) => {
        if (config.logLevel <= LogLevel.Debug) {
            console.debug(
                `${response.config.functionName ?? response.config.url} response:`,
                response,
            );
        }
        trackEvent(EventType.ApiRequest, {
            result: 'success',
            statusCode: response.status,
            url: response.config.url,
            functionName: response.config.functionName,
        });
        return response;
    },
    (err: AxiosError) => {
        if (config.logLevel <= LogLevel.Error) {
            console.error(`${err.config?.functionName ?? err.config?.url} error:`, err);
        }
        trackEvent(EventType.ApiRequest, {
            result: 'failure',
            statusCode: err.status,
            url: err.config?.url,
            functionName: err.config?.functionName,
        });
        return Promise.reject(err);
    },
);
