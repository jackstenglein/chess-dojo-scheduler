'use strict';

import {
    DecimalReturnType,
    ExecuteStatementCommand,
    ExecuteStatementCommandInput,
    RDSDataClient,
    SqlParameter,
} from '@aws-sdk/client-rds-data';
import { Chess } from '@jackstenglein/chess';
import {
    PlayerExplorerRequest,
    PlayerExplorerRequestSchema,
    PlayerExplorerResponseSchema,
    ResultType,
    TimeClass,
} from '@jackstenglein/chess-dojo-common/src/explorer/playerExplorer';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    errToApiGatewayProxyResultV2,
    parseEvent,
    success,
} from 'chess-dojo-directory-service/api';

const dbClusterArn = process.env.DB_CLUSTER_ARN;
const secretArn = process.env.DB_SECRET_ARN;
const databaseName = process.env.DB_NAME;

const rdsClient = new RDSDataClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: ', event);
        const request = parseEvent(event, PlayerExplorerRequestSchema);

        const command = getExecuteStatementCommand(request);
        const response = await rdsClient.send(command);
        console.log('Aurora Response: ', JSON.stringify(response));

        const moves = PlayerExplorerResponseSchema.parse(
            response.records?.map((r) => ({
                san: r[0].stringValue,
                totalWhiteElo: r[1].longValue,
                totalBlackElo: r[2].longValue,
                total: r[3].longValue,
                white: r[4].longValue,
                black: r[5].longValue,
                draws: r[6].longValue,
            })) ?? [],
        );

        return success(moves);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

function getExecuteStatementCommand(request: PlayerExplorerRequest): ExecuteStatementCommand {
    const chess = new Chess({ fen: request.fen });
    const normalizedFen = chess.normalizedFen();
    const zobrist = chess.hash();

    const parameters: SqlParameter[] = [
        { name: 'id', value: { longValue: request.player } },
        { name: 'zobrist', value: { stringValue: zobrist } },
        { name: 'color', value: { stringValue: request.color } },
        { name: 'fen', value: { stringValue: normalizedFen } },
    ];

    let subquery = `SELECT
        san, white_elo_normalized, black_elo_normalized, result 
    FROM player_positions
    INNER JOIN games ON player_positions.game_id = games.id
    WHERE
        player_positions.player_id = :id
        AND zobrist = unhex(:zobrist)
        AND player_positions.color = :color
        AND fen = :fen`;

    if (request.result && request.result.length !== Object.values(ResultType.enum).length) {
        subquery += ` AND result in (${request.result
            .map((r) => {
                if (r === ResultType.enum.win) {
                    return request.color === 'white' ? `'1-0'` : `'0-1'`;
                }
                if (r === ResultType.enum.loss) {
                    return request.color === 'white' ? `'0-1'` : `'1-0'`;
                }
                return `'1/2-1/2'`;
            })
            .join(', ')})`;
    }
    if (request.mode) {
        subquery += ` AND rated = ${request.mode === 'rated' ? 'true' : 'false'}`;
    }
    if (request.timeClass && request.timeClass.length !== Object.values(TimeClass.enum).length) {
        subquery += ` AND time_class in (${request.timeClass.map((tc) => `'${tc}'`)})`;
    }
    if (request.opponentRating) {
        const min = request.opponentRating[0] ?? 0;
        const max = request.opponentRating[1] ?? 10000;
        subquery += ` AND ${request.color === 'white' ? 'black_elo' : 'white_elo'} BETWEEN ${min} AND ${max}`;
    }
    if (request.plyCount) {
        const min = request.plyCount[0] ?? 0;
        const max = request.plyCount[1] ?? 10000;
        subquery += ` AND ply_count BETWEEN ${min} AND ${max}`;
    }
    if (request.limit) {
        subquery += ` ORDER BY played_at DESC LIMIT ${request.limit}`;
    }

    const sql = `SELECT
        san,
        sum(white_elo_normalized),
        sum(black_elo_normalized),
        count(*) as total,
        sum(if(result = '1-0', 1, 0)),
        sum(if(result = '0-1', 1, 0)),
        sum(if(result = '1/2-1/2', 1, 0))
    FROM (${subquery}) AS subquery
    GROUP BY san ORDER BY total desc;`;

    const input: ExecuteStatementCommandInput = {
        secretArn: secretArn,
        resourceArn: dbClusterArn,
        sql: sql,
        database: databaseName,
        resultSetOptions: {
            decimalReturnType: DecimalReturnType.DOUBLE_OR_LONG,
        },
        parameters,
    };

    console.log('Aurora Input: ', input);
    return new ExecuteStatementCommand(input);
}
