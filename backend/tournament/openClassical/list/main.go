package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

type ListPreviousOpenClassicalsResponse struct {
	OpenClassicals   []database.OpenClassical `json:"openClassicals"`
	LastEvaluatedKey string                   `json:"lastEvaluatedKey"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	startKey := event.QueryStringParameters["startKey"]
	openClassicals, lastKey, err := repository.ListPreviousOpenClassicals(startKey)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(ListPreviousOpenClassicalsResponse{
		OpenClassicals:   openClassicals,
		LastEvaluatedKey: lastKey,
	}), nil
}
