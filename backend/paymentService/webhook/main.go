package main

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/davecgh/go-spew/spew"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService/secrets"
	stripe "github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/webhook"
)

var repository = database.DynamoDB
var endpointSecret = ""

const funcName = "payment-webhook"

func init() {
	key, err := secrets.GetApiKey()
	if err != nil {
		log.Error("Failed to get Stripe key: ", err)
		return
	}
	stripe.Key = key

	endpointSecret, err = secrets.GetEndpointSecret()
	if err != nil {
		log.Error("Failed to get Stripe endpoint secret: ", err)
	}
}

func main() {
	lambda.Start(handler)
}

// handler responds to Stripe webhook events.
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
	case "checkout.session.completed":
		return handleCheckoutSessionCompleted(&stripeEvent), nil

	default:
		log.Debugf("Unhandled event type: %s", stripeEvent.Type)
	}

	return api.Success(funcName, nil), nil
}

// Responds to Stripe checkout.session.completed events.
func handleCheckoutSessionCompleted(event *stripe.Event) api.Response {
	var checkoutSession stripe.CheckoutSession
	if err := json.Unmarshal(event.Data.Raw, &checkoutSession); err != nil {
		err := errors.Wrap(400, "Invalid request: unable to unmarshal event data", "", err)
		return api.Failure(funcName, err)
	}

	str := spew.Sdump(checkoutSession)
	log.Debugf("Got checkout session: %s", str)

	checkoutType := checkoutSession.Metadata["type"]
	switch checkoutType {
	case "COURSE":
		return handleCoursePurchase(checkoutSession.ClientReferenceID, strings.Split(checkoutSession.Metadata["courseIds"], ","))
	case "SUBSCRIPTION":
		return handleSubscriptionPurchase(&checkoutSession)
	}

	return api.Success(funcName, nil)
}

// Saves the given courseIds in the provided user's PurchasedCourses map.
func handleCoursePurchase(username string, courseIds []string) api.Response {
	if username == "" {
		// Course purchased by anonymous user
		return api.Success(funcName, nil)
	}

	user, err := repository.GetUser(username)
	if err != nil {
		return api.Failure(funcName, err)
	}

	if user.PurchasedCourses == nil {
		user.PurchasedCourses = make(map[string]bool)
	}

	for _, id := range courseIds {
		user.PurchasedCourses[id] = true
	}

	_, err = repository.UpdateUser(username, &database.UserUpdate{
		PurchasedCourses: &user.PurchasedCourses,
	})
	if err != nil {
		return api.Failure(funcName, err)
	}
	return api.Success(funcName, nil)
}

// Handles saving a subscription purchase on the user in the checkout session.
func handleSubscriptionPurchase(checkoutSession *stripe.CheckoutSession) api.Response {
	if checkoutSession.ClientReferenceID == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: no clientReferenceId included", ""))
	}

	paymentInfo := database.PaymentInfo{
		CustomerId:         checkoutSession.Customer.ID,
		SubscriptionId:     checkoutSession.Subscription.ID,
		SubscriptionStatus: database.SubscriptionStatus_Subscribed,
	}
	update := database.UserUpdate{
		PaymentInfo:        &paymentInfo,
		SubscriptionStatus: stripe.String(database.SubscriptionStatus_Subscribed),
	}

	_, err := repository.UpdateUser(checkoutSession.ClientReferenceID, &update)
	if err != nil {
		return api.Failure(funcName, err)
	}
	return api.Success(funcName, nil)
}
