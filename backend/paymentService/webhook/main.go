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
	payment "github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService/secrets"
	stripe "github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/webhook"
)

var repository = database.DynamoDB
var endpointSecret = ""

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
	case "checkout.session.completed":
		return handleCheckoutSessionCompleted(&stripeEvent), nil

	case "checkout.session.expired":
		return handleCheckoutSessionExpired(&stripeEvent), nil

	case "customer.subscription.deleted":
		return handleSubscriptionDeletion(&stripeEvent), nil

	default:
		log.Debugf("Unhandled event type: %s", stripeEvent.Type)
	}

	return api.Success(nil), nil
}

// Responds to Stripe checkout.session.completed events.
func handleCheckoutSessionCompleted(event *stripe.Event) api.Response {
	var checkoutSession stripe.CheckoutSession
	if err := json.Unmarshal(event.Data.Raw, &checkoutSession); err != nil {
		err := errors.Wrap(400, "Invalid request: unable to unmarshal event data", "", err)
		return api.Failure(err)
	}

	str := spew.Sdump(checkoutSession)
	log.Debugf("Got checkout session: %s", str)

	checkoutType := checkoutSession.Metadata["type"]
	switch checkoutType {
	case string(payment.CheckoutSessionType_Course):
		return handleCoursePurchase(checkoutSession.ClientReferenceID, strings.Split(checkoutSession.Metadata["courseIds"], ","))
	case string(payment.CheckoutSessionType_Subscription):
		return handleSubscriptionPurchase(&checkoutSession)
	case string(payment.CheckoutSessionType_Coaching):
		return handleCoachingPurchase(&checkoutSession)
	}

	return api.Success(nil)
}

// Saves the given courseIds in the provided user's PurchasedCourses map.
func handleCoursePurchase(username string, courseIds []string) api.Response {
	if username == "" {
		// Course purchased by anonymous user
		return api.Success(nil)
	}

	user, err := repository.GetUser(username)
	if err != nil {
		return api.Failure(err)
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
		return api.Failure(err)
	}
	return api.Success(nil)
}

// Handles saving a subscription purchase on the user in the checkout session.
func handleSubscriptionPurchase(checkoutSession *stripe.CheckoutSession) api.Response {
	if checkoutSession.ClientReferenceID == "" {
		return api.Failure(errors.New(400, "Invalid request: no clientReferenceId included", ""))
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
		return api.Failure(err)
	}
	return api.Success(nil)
}

// Handles a successful coaching lesson purchase by setting the event participant's
// stripe data.
func handleCoachingPurchase(checkoutSession *stripe.CheckoutSession) api.Response {
	username := checkoutSession.Metadata["username"]
	eventId := checkoutSession.Metadata["eventId"]

	if username == "" || eventId == "" {
		return api.Failure(errors.New(400, "Invalid request: username and eventId are required metadata", ""))
	}

	if _, err := repository.MarkParticipantPaid(eventId, username, checkoutSession); err != nil {
		return api.Failure(err)
	}
	return api.Success(nil)
}

// Handles a Stripe checkout session expiring.
func handleCheckoutSessionExpired(event *stripe.Event) api.Response {
	var checkoutSession stripe.CheckoutSession
	if err := json.Unmarshal(event.Data.Raw, &checkoutSession); err != nil {
		err := errors.Wrap(400, "Invalid request: unable to unmarshall event data", "", err)
		return api.Failure(err)
	}
	log.Debugf("Checkout session expired: %s", spew.Sdump(checkoutSession))

	checkoutType := checkoutSession.Metadata["type"]
	switch checkoutType {
	case string(payment.CheckoutSessionType_Coaching):
		return handleCoachingSessionExpired(&checkoutSession)
	}

	log.Debugf("Unhandled checkout session type: %s", checkoutType)
	return api.Success(nil)
}

// Handles a Stripe checkout session for a coaching lesson expiring.
func handleCoachingSessionExpired(checkoutSession *stripe.CheckoutSession) api.Response {
	username := checkoutSession.Metadata["username"]
	coachUsername := checkoutSession.Metadata["coachUsername"]
	eventId := checkoutSession.Metadata["eventId"]

	if username == "" || coachUsername == "" || eventId == "" {
		return api.Failure(errors.New(400, "Invalid request: username, coachUsername and eventId are required metadata", ""))
	}

	participant := database.Participant{
		Username: username,
	}
	event := database.Event{
		Id:    eventId,
		Owner: coachUsername,
		Participants: map[string]*database.Participant{
			username: &participant,
		},
	}
	_, err := repository.LeaveEvent(&event, &participant)
	if err != nil {
		return api.Failure(errors.Wrap(500, "Temporary server error", "Failed to leave event", err))
	}

	return api.Success(nil)
}

// Handles deleting a subscription on the user in the subscription metadata.
func handleSubscriptionDeletion(event *stripe.Event) api.Response {
	var subscription stripe.Subscription
	if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
		err := errors.Wrap(400, "Invalid request: unable to unmarshal event data", "", err)
		return api.Failure(err)
	}

	str := spew.Sdump(subscription)
	log.Debugf("Got subscription: %s", str)

	username := subscription.Metadata["username"]
	if username == "" {
		return api.Failure(errors.New(400, "Invalid request: no username in subscription metadata", ""))
	}

	paymentInfo := database.PaymentInfo{
		CustomerId:         subscription.Customer.ID,
		SubscriptionId:     subscription.ID,
		SubscriptionStatus: database.SubscriptionStatus_Canceled,
	}
	update := database.UserUpdate{
		PaymentInfo:        &paymentInfo,
		SubscriptionStatus: stripe.String(database.SubscriptionStatus_FreeTier),
	}

	_, err := repository.UpdateUser(username, &update)
	if err != nil {
		return api.Failure(err)
	}
	return api.Success(nil)
}
