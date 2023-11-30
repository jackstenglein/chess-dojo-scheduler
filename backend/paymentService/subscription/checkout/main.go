package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	payment "github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService"
)

const funcName = "subscription-checkout-handler"

type SubscriptionCheckoutResponse struct {
	Url string `json:"url"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)

	request := payment.PurchaseSubscriptionRequest{}
	if err := json.Unmarshal([]byte(event.Body), &request); err != nil {
		return api.Failure(funcName, errors.New(400, "Invalid request: body could not be unmarshalled", "")), nil
	}

	url, err := payment.PurchaseSubscriptionUrl(info.Username, &request)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, SubscriptionCheckoutResponse{Url: url}), nil
}
