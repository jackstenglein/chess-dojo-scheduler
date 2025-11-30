package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	payment "github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService"
)

var repository database.UserGetter = database.DynamoDB

type SubscriptionManageRequest struct {
	Tier     database.SubscriptionTier `json:"tier"`
	Interval string                    `json:"interval"`
}

type SubscriptionManageResponse struct {
	Url string `json:"url"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	info := api.GetUserInfo(event)
	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(err), nil
	}

	if !isValidCustomerId(user.PaymentInfo.GetCustomerId()) {
		return api.Failure(errors.New(400, fmt.Sprintf("Invalid request: user has invalid Stripe customer ID %q", user.PaymentInfo.GetCustomerId()), "")), nil
	}

	var request SubscriptionManageRequest
	if err := json.Unmarshal([]byte(event.Body), &request); err != nil {
		return api.Failure(errors.Wrap(400, "Failed to unmarshal request body", "", err)), nil
	}

	if request.Tier != "" && user.PaymentInfo.GetSubscriptionId() == "" {
		return api.Failure(errors.New(400, "Invalid request: subscription tier specified but user has no subscription ID", "")), nil
	}

	session, err := payment.GetBillingPortalSession(user.PaymentInfo, request.Tier, request.Interval)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(SubscriptionManageResponse{Url: session.URL}), nil
}

func isValidCustomerId(customerID string) bool {
	return customerID != "" && customerID != "WIX" && customerID != "OVERRIDE"
}
