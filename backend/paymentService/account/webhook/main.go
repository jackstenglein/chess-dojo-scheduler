package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/davecgh/go-spew/spew"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService/secrets"
	"github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/webhook"
)

const funcName = "payment-connect-webhook"

var endpointSecret = ""

func init() {
	key, err := secrets.GetApiKey()
	if err != nil {
		log.Error("Failed to get Stripe key: ", err)
		return
	}
	stripe.Key = key

	endpointSecret, err = secrets.GetConnectEndpointSecret()
	if err != nil {
		log.Error("Failed to get Stripe connect endpoint secret: ", err)
	}
}

func main() {
	lambda.Start(handler)
}

// Responds to Stripe webhook events.
func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	signatureHeader, ok := event.Headers["stripe-signature"]
	if !ok {
		err := errors.New(400, "Invalid request: missing stripe signature", "")
		return api.Failure(funcName, err), nil
	}

	stripeEvent, err := webhook.ConstructEvent([]byte(event.Body), signatureHeader, endpointSecret)
	if err != nil {
		err = errors.Wrap(400, "Invalid request: stripe signature did not verify", "", err)
		return api.Failure(funcName, err), nil
	}

	str := spew.Sdump(stripeEvent)
	log.Debugf("Stripe Event: %s", str)

	switch stripeEvent.Type {
	case "account.updated":
		return handleAccountUpdated(&stripeEvent), nil

	default:
		log.Debugf("Unhandled event type: %s", stripeEvent.Type)
	}

	return api.Success(funcName, nil), nil
}

// Responds to Stripe account.updated events.
func handleAccountUpdated(event *stripe.Event) api.Response {
	return api.Success(funcName, nil)
}
