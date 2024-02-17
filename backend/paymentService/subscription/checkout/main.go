package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	payment "github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService"
)

var repository database.UserGetter = database.DynamoDB

type SubscriptionCheckoutResponse struct {
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

	request := payment.PurchaseSubscriptionRequest{}
	if err := json.Unmarshal([]byte(event.Body), &request); err != nil {
		return api.Failure(errors.New(400, "Invalid request: body could not be unmarshalled", "")), nil
	}

	url, err := payment.PurchaseSubscriptionUrl(user, &request)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(SubscriptionCheckoutResponse{Url: url}), nil
}
