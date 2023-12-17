package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	payment "github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService"
)

var repository database.UserGetter = database.DynamoDB

type SubscriptionManageResponse struct {
	Url string `json:"url"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(err), nil
	}

	if user.PaymentInfo == nil || user.PaymentInfo.CustomerId == "" {
		return api.Failure(errors.New(400, "Invalid request: user does not have a Stripe customer ID", "")), nil
	}

	session, err := payment.GetBillingPortalSession(user.PaymentInfo.CustomerId)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(SubscriptionManageResponse{Url: session.URL}), nil
}
