import { ApiError } from 'chess-dojo-directory-service/api';

/**
 * Returns the specified pathname segment from the given URL.
 * @param url The URL to extract the pathname segment from.
 * @param idx The index of the pathname segment to extract.
 * @returns The specified pathname segment from the URL.
 */
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
    }

    const parts = urlObj.pathname.split('/').filter((part) => part);
    if (idx >= parts.length) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid url',
            privateMessage: `Attempted to extract path segment index ${idx}, but only ${parts.length} segments found in url: ${url}`,
        });
    }

    return parts[idx];
}
