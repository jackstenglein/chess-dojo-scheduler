import { APIGatewayProxyResultV2 } from 'aws-lambda';

export class ApiError extends Error {
    statusCode: number;
    publicMessage: string;
    privateMessage?: string;
    cause: any;

    constructor({
        statusCode,
        publicMessage,
        privateMessage,
        cause,
    }: {
        statusCode: number;
        publicMessage?: string;
        privateMessage?: string;
        cause?: any;
    }) {
        super();
        this.statusCode = statusCode;
        this.publicMessage = publicMessage || 'Temporary server error';
        this.privateMessage = privateMessage;
        this.cause = cause;
    }

    apiGatewayResultV2(): APIGatewayProxyResultV2 {
        console.error(
            'Status Code:%d\rPublic Message: %s\rPrivate Message:%s\rCause:%s\rStack:%s\r',
            this.statusCode,
            this.publicMessage,
            this.privateMessage,
            this.cause,
            this.stack,
        );
        return {
            statusCode: this.statusCode,
            isBase64Encoded: false,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: this.publicMessage, code: this.statusCode }),
        };
    }
}

function unknownError(err: any): APIGatewayProxyResultV2 {
    console.error('Unknown error: ', err);
    return {
        statusCode: 500,
        isBase64Encoded: false,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Temporary server error', code: 500 }),
    };
}

export function errToApiGatewayProxyResultV2(err: any): APIGatewayProxyResultV2 {
    if (err instanceof ApiError) {
        return err.apiGatewayResultV2();
    }
    return unknownError(err);
}

/**
 * Returns a successful API response, with the given value marshalled as
 * the JSON body.
 * @param value The JSON body to return.
 * @returns The API gateway result object.
 */
export function success(value: any): APIGatewayProxyResultV2 {
    console.log('Response: %j', value);
    return {
        statusCode: 200,
        body: JSON.stringify(value),
    };
}

export interface UserInfo {
    username: string;
    email: string;
}

/**
 * Extracts the user info from the Lambda event.
 * @param event The Lambda event to get the user info from.
 * @returns An object containing the username and email, if present on the event.
 */
export function getUserInfo(event: any): UserInfo {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
        return {
            username: '',
            email: '',
        };
    }

    return {
        username: claims['cognito:username'] || '',
        email: claims['email'] || '',
    };
}
