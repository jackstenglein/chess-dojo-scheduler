import { APIGatewayProxyEvent, APIGatewayProxyHandlerV2, APIGatewayProxyResult } from 'aws-lambda';
import { MongoClient } from 'mongodb';
import { RoundRobinIdFinder } from './RoundRobinIdFinder';
import { RoundRobinModel } from './RoundRobinModel';
import { ApiError, errToApiGatewayProxyResultV2, parseEvent } from 'chess-dojo-directory-service/api';
import { FindRoundRobinIdSchema } from '@jackstenglein/chess-dojo-common/src/roundRobin/api';

/**
 * This API represents getting the tournament data and showing it on the UI
 */

// MongoDB Connection Setup data, Collection_name can point to rr-tournaments-beta for beta testing 
const CONNECTION_STRING = process.env.MongoConnect || '';
const DATABASE_NAME = 'Lisebot-database';
const COLLECTION_NAME = 'rr-tournaments ';


let mongoClient: MongoClient;

/**
 * This method connects to given MongoDB 
 * @returns MongoClient promise
 */
async function getMongoClient(): Promise<MongoClient> {
    if (!mongoClient) {
        mongoClient = new MongoClient(CONNECTION_STRING);
        await mongoClient.connect();
    }
    return mongoClient;
}

/**
 * The api response definiton it contains a list of tournaments and a message
 */
interface Response {
    tournaments: RoundRobinModel[];
    message: string;
}

// Lambda handler
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: ', event);
        const request = parseEvent(event, FindRoundRobinIdSchema);
    } catch (err) {
        errToApiGatewayProxyResultV2(err);
    }

    const queryParams = event.queryStringParameters || {};
    const startCohortHeader = queryParams['cohort-start'];
    let startCohort: number;

    // Validate input
    if (!startCohortHeader) {
        return createErrorResponse('cohort-start is missing!');
    }

    try {
        startCohort = parseInt(startCohortHeader);
        if (isNaN(startCohort)) {
            throw new Error('Invalid cohort format');
        }
    } catch (err) {
        return createErrorResponse('Invalid cohort format');
    }

    try {
        // Get MongoDB client and collection
        const client = await getMongoClient();
        const database = client.db(DATABASE_NAME);
        const collection = database.collection(COLLECTION_NAME);
        console.log('DB_NAME:', DATABASE_NAME);
        console.log('COLL_NAME:', COLLECTION_NAME);
        console.log('Response:', CONNECTION_STRING);
        console.log('Query Parameters:', queryParams);
        console.log('Parsed Start Cohort:', startCohort);

        // Fetch tournament IDs
        const roundRobinIdFinder = new RoundRobinIdFinder();
        console.log('here man');
        const rrs = await roundRobinIdFinder.getTournamentIdForStartCohort(collection, startCohort);

        const response: Response = {
            tournaments: rrs,
            message: 'Found IDs successfully!',
        };

        console.log('Response:', response);

        return {
            statusCode: 200,
            body: JSON.stringify(response),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        };
    } catch (err) {
        console.error('Error:', err);
        return createErrorResponse('Internal server error');
    }
};

/**
 * Helper method that creates error responses
 * @param message exception message
 * @returns ApiGatewayProxyResult Error reponse 
 */
function createErrorResponse(message: string): APIGatewayProxyResult {
    return {
        statusCode: 400,
        body: JSON.stringify({ message }),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    };
}
