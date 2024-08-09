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
        publicMessage: string;
        privateMessage?: string;
        cause?: any;
    }) {
        super();
        this.statusCode = statusCode;
        this.publicMessage = publicMessage;
        this.privateMessage = privateMessage;
        this.cause = cause;
    }

    apiGatewayResultV2(): APIGatewayProxyResultV2 {
        console.error(
            'Status Code:%d\rPublic Message: %s\rPrivate Message:%s\rCause:%s',
            this.statusCode,
            this.publicMessage,
            this.privateMessage,
            this.cause,
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
