package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.OpeningLister = database.DynamoDB

const funcName = "opening-list-handler"

type ListOpeningsResponse struct {
	Openings         []*database.Opening `json:"openings"`
	LastEvaluatedKey string              `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	startKey, _ := event.QueryStringParameters["startKey"]
	openings, lastKey, err := repository.ListOpenings(startKey)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &ListOpeningsResponse{
		Openings:         openings,
		LastEvaluatedKey: lastKey,
	}), nil
}

func main() {
	lambda.Start(Handler)
}
