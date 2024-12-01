'use strict';

import { PdfExportSchema } from '@jackstenglein/chess-dojo-common/src/pgn/export';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    errToApiGatewayProxyResultV2,
    parseBody,
} from 'chess-dojo-directory-service/api';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { TexGenerator } from './TexGenerator';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);

        const request = parseBody(event, PdfExportSchema);
        const generator = new TexGenerator({
            ...request,
            qrcodeFilename: `/tmp/${event.requestContext.requestId}-qrcode.png`,
        });
        fs.writeFileSync(
            `/tmp/${event.requestContext.requestId}.tex`,
            await generator.toTex(),
        );

        console.log('Generated tex file');

        execSync(
            `pdflatex -interaction=nonstopmode ${event.requestContext.requestId}.tex`,
            {
                cwd: '/tmp',
                stdio: 'inherit',
            },
        );

        const base64body = fs
            .readFileSync(`/tmp/${event.requestContext.requestId}.pdf`)
            .toString('base64');
        return {
            headers: { 'Content-Type': 'application/pdf' },
            statusCode: 200,
            body: base64body,
            isBase64Encoded: true,
        };
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};
