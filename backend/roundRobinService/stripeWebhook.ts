import { RoundRobinRegisterSchema } from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    success,
} from 'chess-dojo-directory-service/api';
import Stripe from 'stripe';
import { register } from './register';
import { getSecret } from './secret';

let stripe: Stripe | undefined = undefined;
let endpointSecret: string | undefined = undefined;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);

        if (!stripe) {
            stripe = new Stripe(
                (await getSecret(`chess-dojo-${process.env.stage}-stripeKey`)) || ''
            );
        }
        if (!endpointSecret) {
            endpointSecret = await getSecret(
                `chess-dojo-${process.env.stage}-stripeRoundRobinEndpoint`
            );
        }

        const signature = event.headers['stripe-signature'];
        const stripeEvent = stripe.webhooks.constructEvent(
            event.body || '',
            signature || '',
            endpointSecret || ''
        );

        switch (stripeEvent.type) {
            case 'checkout.session.completed':
                return await handleCheckoutSessionCompleted(stripeEvent);
            default:
                return success(null);
        }
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

async function handleCheckoutSessionCompleted(
    event: Stripe.CheckoutSessionCompletedEvent
): Promise<APIGatewayProxyResultV2> {
    const checkoutSession = event.data.object;
    const checkoutType = checkoutSession.metadata?.type;

    switch (checkoutType) {
        case 'ROUND_ROBIN':
            return handleRoundRobinPurchase(checkoutSession);
        default:
            return success(null);
    }
}

async function handleRoundRobinPurchase(
    session: Stripe.Checkout.Session
): Promise<APIGatewayProxyResultV2> {
    const request = RoundRobinRegisterSchema.parse(session.metadata);
    if (!session.client_reference_id) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: client_reference_id is required',
        });
    }

    await register({
        username: session.client_reference_id,
        request,
        checkoutSession: session,
    });
    return success(null);
}
