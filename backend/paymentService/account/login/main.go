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

const funcName = "payment-account-login-handler"

var repository database.UserGetter = database.DynamoDB

type AccountLoginResponse struct {
	Url string `json:"url"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: username is required", "")), nil
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	if user.CoachInfo == nil || user.CoachInfo.StripeId == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: user does not have a Stripe account", "")), nil
	}

	loginLink, err := payment.LoginLink(user.CoachInfo.StripeId)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, AccountLoginResponse{Url: loginLink.URL}), nil
}
