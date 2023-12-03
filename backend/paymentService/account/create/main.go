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

const funcName = "payment-account-create-handler"

var repository database.UserUpdater = database.DynamoDB

type AccountCreateResponse struct {
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

	if !user.IsCoach {
		return api.Failure(funcName, errors.New(400, "Invalid request: user is not a coach", "")), nil
	}

	if user.CoachInfo != nil && user.CoachInfo.StripeId != "" {
		return createAccountLink(user)
	}

	account, err := payment.CreateConnectedAccount(user.Username, user.Email)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	user, err = repository.UpdateUser(user.Username, &database.UserUpdate{
		CoachInfo: &database.CoachInfo{
			StripeId: account.ID,
		},
	})
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return createAccountLink(user)
}

func createAccountLink(user *database.User) (api.Response, error) {
	accountLink, err := payment.AccountLink(user.CoachInfo.StripeId)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, AccountCreateResponse{Url: accountLink.URL}), nil
}
