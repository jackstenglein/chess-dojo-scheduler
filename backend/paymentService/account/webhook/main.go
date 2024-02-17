package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/davecgh/go-spew/spew"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService/secrets"
	"github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/webhook"
)

var repository database.UserUpdater = database.DynamoDB
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
	log.Infof("Event: %#v", event)

	signatureHeader, ok := event.Headers["stripe-signature"]
	if !ok {
		err := errors.New(400, "Invalid request: missing stripe signature", "")
		return api.Failure(err), nil
	}

	stripeEvent, err := webhook.ConstructEvent([]byte(event.Body), signatureHeader, endpointSecret)
	if err != nil {
		err = errors.Wrap(400, "Invalid request: stripe signature did not verify", "", err)
		return api.Failure(err), nil
	}

	str := spew.Sdump(stripeEvent)
	log.Debugf("Stripe Event: %s", str)

	switch stripeEvent.Type {
	case "account.updated":
		return handleAccountUpdated(&stripeEvent), nil

	default:
		log.Debugf("Unhandled event type: %s", stripeEvent.Type)
	}

	return api.Success(nil), nil
}

// Responds to Stripe account.updated events.
func handleAccountUpdated(event *stripe.Event) api.Response {
	var account stripe.Account
	if err := json.Unmarshal(event.Data.Raw, &account); err != nil {
		err = errors.Wrap(400, "Invalid request: unable to unmarshal event data", "", err)
		return api.Failure(err)
	}

	username := account.Metadata["username"]
	if username == "" {
		err := errors.New(400, "Invalid request: account does not have username metadata", "")
		return api.Failure(err)
	}

	onboardingComplete := account.DetailsSubmitted &&
		account.ChargesEnabled &&
		account.PayoutsEnabled &&
		account.Capabilities != nil &&
		account.Capabilities.Transfers == stripe.AccountCapabilityStatusActive

	update := database.UserUpdate{
		CoachInfo: &database.CoachInfo{
			StripeId:           account.ID,
			OnboardingComplete: onboardingComplete,
		},
	}
	if _, err := repository.UpdateUser(username, &update); err != nil {
		return api.Failure(err)
	}

	return api.Success(nil)
}
