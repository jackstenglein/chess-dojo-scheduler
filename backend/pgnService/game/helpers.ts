import { ApiError } from './errors';

export function getPathSegment(url: string | undefined, idx: number) {
    if (!url) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'URL required',
            privateMessage: 'Attempted to parse an undefined URL',
        });
    }

    let urlObj: URL;
    try {
        urlObj = new URL(url.trim());
    } catch (error) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid url',
            privateMessage: `Was unable to parse this URL: ${url}`,
        });
        // ...
    }

    const parts = urlObj.pathname.split('/').filter((part) => part);
    if (parts.length <= idx) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid url',
            privateMessage: `Expected more path segments than existed when extracting url fields: ${url}`,
        });
    }

    return parts[idx];
}
